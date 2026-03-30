import { InspirationImagesQuery, StyleGuideQuery } from "@/convex/query.config";
import { prompts } from "@/prompts";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { generatedUIId, currentHTML, projectId, pageIndex } = body;

    if (
      !generatedUIId ||
      !currentHTML ||
      !projectId ||
      pageIndex === undefined
    ) {
      return new Response("Missing required fields", { status: 400 });
    }

    /////////// subsciption logic

    // get project id from request body for gyle guide
    const styleGuide = await StyleGuideQuery(projectId);
    const styleGuideData = styleGuide.styleGuide._valueJSON as unknown as {
      colorSections: unknown[];
      typographySections: unknown[];
    };

    // get inspiration images
    // CHECK: inspiration images getting properly
    const inspirationResult = await InspirationImagesQuery(projectId);
    const images = inspirationResult.images._valueJSON as unknown as {
      url: string;
    }[];

    const imageUrls = images.map((img) => img.url).filter(Boolean);

    //CHECK: colors and typography fetched properly
    const colors = styleGuideData?.colorSections || [];
    const typography = styleGuideData?.typographySections || [];

    //define page type for dynamic generation
    //ENHANCEMENT: this is hardcoded make it dynamic for the type of website user wants
    const pageTypes = [
      "Dashboard/Analytics page with charts, metrics, and KPIs",
      "Settings/Configuration page with preferences and account management",
      "User Profile page with pesonal information and activity",
      "Data Listing/Table page with search, filters, and pagination",
    ];

    const selectedPageType = pageTypes[pageIndex] || pageTypes[0];

    //bilde user prompt for workflow generation
    let userPrompt = `You are tasked with creating a workflow page that complements the provided main page design. 

MAIN PAGE REFERENCE (for design consistency):
${currentHTML.substring(0, 2000)}...

WORKFLOW PAGE TO GENERATE:
Create a "${selectedPageType}" that would logically complement the main page shown above.

DYNAMIC PAGE REQUIREMENTS:
1. Analyze the main page design and determine what type of application this appears to be
2. Based on that analysis, create a fitting ${selectedPageType} that would make sense in this application context
3. The page should feel like a natural extension of the main page's functionality
4. Use your best judgment to determine appropriate content, features, and layout for this page type

DESIGN CONSISTENCY REQUIREMENTS:
1. Use the EXACT same visual style, color scheme, and typography as the main page
2. Maintain identical component styling (buttons, cards, forms, navigation, etc.)
3. Keep the same overall layout structure and spacing patterns  
4. Use similar UI patterns and component hierarchy
5. Ensure the page feels like it belongs to the same application - perfect visual consistency

TECHNICAL REQUIREMENTS:
1. Generate clean, semantic HTML with Tailwind CSS classes matching the main page
2. Use similar shadcn/ui component patterns as shown in the main page
3. Include responsive design considerations
4. Add proper accessibility attributes (aria-labels, semantic HTML)
5. Create a functional, production-ready page layout
6. Include realistic content and data that fits the page type and application context

CONTENT GUIDELINES:
- Generate realistic, contextually appropriate content (don't use Lorem Ipsum)
- Create functional UI elements appropriate for the page type
- Include proper navigation elements if they exist in the main page
- Add interactive elements like buttons, forms, tables, etc. as appropriate for the page type

Please generate a complete, professional HTML page that serves as a ${selectedPageType} while maintaining perfect visual and functional consistency with the main design.`;

    if (colors.length > 0) {
      userPrompt += `\n\nStyle Guide Colors:\n${(
        colors as Array<{
          swatches: Array<{
            name: string;
            hexColor: string;
            description: string;
          }>;
        }>
      )
        .map((color) =>
          color.swatches
            .map(
              (swatch) =>
                `${swatch.name}: ${swatch.hexColor}, ${swatch.description}`,
            )
            .join(", "),
        )
        .join(", ")}`;
    }

    if (typography.length > 0) {
      userPrompt += `\n\nTypography:\n${(
        typography as Array<{
          styles: Array<{
            name: string;
            description: string;
            fontFamily: string;
            fontWeight: string;
            fontSize: string;
            lineHeight: string;
          }>;
        }>
      )
        .map((typo) =>
          typo.styles
            .map(
              (style) =>
                `${style.name}: ${style.description}, ${style.fontFamily}, ${style.fontWeight}, ${style.fontSize}, ${style.lineHeight}`,
            )
            .join(", "),
        )
        .join(", ")}`;
    }

    if (imageUrls.length > 0) {
      userPrompt += `\n\nInspiration Images Available: ${imageUrls.length} reference images for visual style and inspiration.`;
    }

    userPrompt += `\n\nPlease generate a professional ${selectedPageType} that maintains complete design consistency with the main page while serving its specific functional purpose. Be creative and contextually appropriate!`;

    //create streaming response
    const result = streamText({
      model: anthropic("claude-3-sonnet-20240229"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt,
            },
            ...imageUrls.map((url) => ({
              type: "image" as const,
              image: url,
            })),
          ],
        },
      ],
      system: prompts.generativeUi.system,
      temperature: 0.7,
    });

    //convert to streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("workflow generation api error:", error);
    return NextResponse.json(
      {
        error: "Failed to process workflow generation request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
