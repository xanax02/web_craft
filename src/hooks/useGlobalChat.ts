import { useGenerateWorkflowMutation } from "@/redux/api/generation";
import { addGeneratedUI, Shape, updateShape } from "@/redux/slice/shapes";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { nanoid } from "@reduxjs/toolkit";
import { useState } from "react";
import { toast } from "sonner";

export const useWorkflowGeneration = () => {
  const dispatch = useAppDispatch();

  const [, { isLoading: isGeneratingWorflow }] = useGenerateWorkflowMutation();

  const allShapes = useAppSelector((state) =>
    Object.values(state.shapes.shapes?.entities || {}).filter(
      (shape): shape is Shape => shape != undefined,
    ),
  );

  const generateWorkflow = async (generatedUIId: string) => {
    try {
      const currentShape = allShapes.find(
        (shape) => shape.id === generatedUIId,
      );

      if (!currentShape || currentShape.type != "generatedui") {
        toast.error("Generated UI not found");
        return;
      }

      if (!currentShape.uiSpecData) {
        toast.error("No design data to generate workflow from");
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const projectId = urlParams.get("project");

      if (!projectId) {
        toast.error("Project ID not found");
        return;
      }

      //TODO: for now its 2 increase in future
      const pageCount = 2;
      toast.loading("Generating workflow pages....", {
        id: "workflow-generation",
      });

      const baseX = currentShape.x + currentShape.w + 100;
      const spacing = Math.max(currentShape.w + 50, 450);

      const workflowPromises = Array.from({ length: pageCount }).map(
        async (_, index) => {
          try {
            const response = await fetch("api/generate/worflow", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                generatedUIId,
                currentHTML: currentShape.uiSpecData,
                projectId,
                pageIndex: index,
              }),
            });

            if (!response.ok) {
              throw new Error(
                `Failed to generate page ${index + 1}: ${response.status}`,
              );
            }

            const workflowPosition = {
              x: baseX + index * spacing,
              y: currentShape.y,
              w: Math.max(400, currentShape.w),
              h: Math.max(300, currentShape.h),
            };

            const workflowId = nanoid();
            dispatch(
              addGeneratedUI({
                ...workflowPosition,
                id: workflowId,
                uiSpecData: null,
                sourceFrameId: currentShape.sourceFrameId,
                isWorkflowPage: true,
              }),
            );

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            let accumulatedHTML = "";

            if (reader) {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                accumulatedHTML += chunk;

                //update workflow page with streamed html
                dispatch(
                  updateShape({
                    id: workflowId,
                    patch: {
                      uiSpecData: accumulatedHTML,
                    },
                  }),
                );
              }
            }
            return { pageIndex: index, success: true };
          } catch (error) {
            console.log(`Error generating page ${index + 1}: ${error}`);
            return { pageIndex: index, success: false, error };
          }
        },
      );

      const results = await Promise.all(workflowPromises);
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      if (successCount === pageCount) {
        toast.success("All workflow pages generted successfully:", {
          id: "workflow-generation",
        });
      } else if (successCount > 0) {
        toast.success(
          `Generated ${successCount}/${pageCount} workflow pages sucessfully!`,
          { id: "workflow-generation" },
        );
        if (failureCount > 0) {
          toast.error(`Failed to generate ${failureCount} workflow pages`);
        }
      } else {
        toast.error("Failed to generate workflow pages", {
          id: "workflow-generation",
        });
      }
    } catch (error) {
      console.error("Workflow generation erro", error);
      toast.error("Failed to generate workflow pages", {
        id: "workflow-generation",
      });
    }
  };
  return {
    generateWorkflow,
    isGeneratingWorflow,
  };
};

export const useGlobalChat = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeGeneratedUIId, setActiveGeneratedUIId] = useState<string | null>(
    null,
  );
  const { generateWorkflow } = useWorkflowGeneration();

  return {
    isChatOpen,
    setIsChatOpen,
    activeGeneratedUIId,
    setActiveGeneratedUIId,
    generateWorkflow,
  };
};
