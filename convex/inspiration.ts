import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getInspirationImages = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) {
      return [];
    }

    const storageIds = project.inspirationImages || [];

    const images = await Promise.all(
      storageIds.map(async (storageId, index) => {
        try {
          const url = await ctx.storage.getUrl(storageId);
          return {
            id: `inspiration-${storageId}`,
            storageId,
            url,
            uploaded: true,
            uploading: false,
            index,
          };
        } catch (error) {
          console.warn(
            `[Convex] Failed to get URL for insp storage id ${storageId}:`,
            error,
          );
          return null;
        }
      }),
    );

    const validImages = images
      .filter((image) => image !== null)
      .sort((a, b) => a!.index - b!.index)
      .map((image) => image!);

    return validImages;
  },
});
