import { MoodBoardImagesQuery } from "@/convex/query.config";
import { MoodBoardImages } from "@/hooks/useStyles";
import { prompts } from "@/prompts";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { projectId } = body;
    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 },
      );
    }

    /////commented logic for subscription based request////
    // const {ok: balanceOk, balance: balanceBalance} = await CreditsBalanceQuery();

    // if(!balanceOk) {
    //     return NextResponse.json(
    //         { error: "Failed to balance" },
    //         { status: 500 },
    //     );
    // }

    // if(balanceBalance === 0) {
    //     return NextResponse.json(
    //         {error: "No credits available"},
    //         {status: 400}
    //     )
    // }
    ///////            //

    const moodBoardImages = await MoodBoardImagesQuery(projectId);
    if (!moodBoardImages || moodBoardImages.images._valueJSON.length === 0) {
      return NextResponse.json(
        {
          error:
            "No mood board images found. Please upload images to the mood board first",
        },
        { status: 400 },
      );
    }

    const images = moodBoardImages.images
      ._valueJSON as unknown as MoodBoardImages[];
    const imageUrls = images.map((image) => image.url).filter(Boolean);
    const systemPrompt = prompts.styleGuide.system;

    const userPrompt = `Analyze these ${images.length} mood board images and generate a design system:
        Extract colors that works harmoniously together and create typorgrahpy that matches the asthetic.
        Return only the JSON object matching the exact schema structure above.
    `;

    // const result = generateObject

    return NextResponse.json({ success: true });
  } catch (error) {
    return new Response("Internal Server Error", { status: 500 });
  }
}
