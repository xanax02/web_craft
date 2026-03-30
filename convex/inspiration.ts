import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const url = await ctx.storage.generateUploadUrl();
    return url;
  },
});

export const addInspirationiImage = mutation({
  args: {
    projectId: v.id("projects"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { projectId, storageId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found or unauthorized");
    }

    const currentImages = project.inspirationImages || [];

    if (currentImages.includes(storageId)) {
      return { success: false, message: "Image already exists" };
    }

    if (currentImages.length >= 6) {
      throw new Error("Maximum of 6 inspiration images allowed per project");
    }

    const updatedImages = [...currentImages, storageId];

    await ctx.db.patch(projectId, {
      inspirationImages: updatedImages,
      lastModified: Date.now(),
    });

    return {
      success: true,
      message: "Inspiration image added successfully",
      totalImages: updatedImages.length,
    };
  },
});

export const removeInspirationImage = mutation({
  args: {
    projectId: v.id("projects"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { projectId, storageId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found or unauthorized");
    }

    const currentImages = project.inspirationImages || [];

    if (!currentImages.includes(storageId)) {
      return { success: false, message: "Image not found" };
    }

    const updatedImages = currentImages.filter((id) => id !== storageId);

    await ctx.db.patch(projectId, {
      inspirationImages: updatedImages,
      lastModified: Date.now(),
    });

    try {
      await ctx.storage.delete(storageId);
    } catch (error) {
      console.warn("Error deleting storage file:", error);
    }

    return {
      success: true,
      message: "Inspiration image removed successfully",
      totalImages: updatedImages.length,
    };
  },
});
