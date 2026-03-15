import MoodBoard from "@/components/style/moodBoard/MoodBoard";
import ThemeContent from "@/components/style/theme/ThemeContent";
import StyleGuideTypography from "@/components/style/typography/StyleGuideTypography";
import { TabsContent } from "@/components/ui/tabs";
import { MoodBoardImagesQuery, StyleGuideQuery } from "@/convex/query.config";
import { MoodBoardImages } from "@/hooks/useStyles";
import { StyleGuide } from "@/redux/api/style-guide";
import { Palette } from "lucide-react";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ project: string }>;
}) {
  const projectId = (await searchParams).project;

  const existingStyleGuide = await StyleGuideQuery(projectId);

  const guide = existingStyleGuide.styleGuide
    ._valueJSON as unknown as StyleGuide;

  const colorGuide = guide?.colorSection || [];
  const typographyGuide = guide?.typographySection || [];

  const exisitingMoodBoardImages = await MoodBoardImagesQuery(projectId);

  const guidedImages = exisitingMoodBoardImages.images
    ._valueJSON as unknown as MoodBoardImages[];

  // console.log("guidedImages", guidedImages);

  return (
    <div>
      <TabsContent value="colors" className="space-y-8">
        {!guidedImages.length ? (
          <div className="space-y-8">
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-muted flex items-center justify-center">
                <Palette className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                No colors generated yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                Upload images to your mood board and generate an Ai-powered
                style guide with colors and typography.
              </p>
            </div>
          </div>
        ) : (
          <ThemeContent colorGuide={colorGuide} />
        )}
      </TabsContent>
      <TabsContent value="typography">
        <StyleGuideTypography typographyGuide={typographyGuide} />
      </TabsContent>
      <TabsContent value="components">
        <MoodBoard guideImages={guidedImages} />
      </TabsContent>
    </div>
  );
}
