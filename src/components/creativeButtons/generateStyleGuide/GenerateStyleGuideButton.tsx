"use client";
import { Button } from "@/components/ui/button";
import { MoodBoardImages, useStyleGuide } from "@/hooks/useStyles";
import { Loader2, Sparkles } from "lucide-react";

type Props = {
  images: MoodBoardImages[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  projectId: string;
};

export default function GenerateStyleGuideButton({
  images,
  fileInputRef,
  projectId,
}: Props) {
  const { handleGenerateStyleGuide, isGenerating } = useStyleGuide(
    projectId,
    images,
    fileInputRef,
  );

  return (
    images.length > 0 && (
      <div className="flex justify-end">
        <Button
          className="rounded-full"
          onClick={handleGenerateStyleGuide}
          disabled={isGenerating || images.some((img) => img.uploading)}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate with AI
            </>
          )}
        </Button>
      </div>
    )
  );
}
