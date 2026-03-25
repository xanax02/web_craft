import { fetchMutation } from "convex/nextjs";
import { inngest } from "./client";
import { api } from "../../convex/_generated/api";

export const testFn = inngest.createFunction(
  { id: "autsave-project-workflow" },
  { event: "project/autsave.requested" },
  async ({ event }) => {
    console.log("[Inngest] Project autosave requested", event);
  },
);

export const autosaveProjectWorkflow = inngest.createFunction(
  { id: "autsave-project-workflow" },
  { event: "project/autosave.requested" },
  async ({ event }) => {
    const { projectId, shapesData, viewportData } = event.data;
    try {
      await fetchMutation(api.projects.updateProjectSketches, {
        projectId,
        sketchesData: shapesData,
        viewportData,
      });

      return { success: true };
    } catch (error) {
      console.error("[Inngest] Project autosave failed", error);
    }
  },
);
