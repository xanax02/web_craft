import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    //onwersip access
    if (project.userId !== userId && !project.isPublic) {
      throw new Error("Access Denied");
    }

    return project;
  },
});

export const createProject = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    sketchData: v.any(),
    thumbnail: v.optional(v.string()),
  },
  handler: async (ctx, { userId, name, sketchData, thumbnail }) => {
    const projectNumber = await getNextProjectNumber(ctx, userId);

    const projectName = name || `Project ${projectNumber}`;

    const projectId = await ctx.db.insert("projects", {
      userId,
      name: projectName,
      sketchData,
      thumbnail,
      projectNumber,
      lastModified: Date.now(),
      createdAt: Date.now(),
      isPublic: false,
    });

    return {
      projectId,
      name: projectName,
      projectNumber,
    };
  },
});

async function getNextProjectNumber(ctx: any, userId: string): Promise<number> {
  const counter = await ctx.db
    .query("project_counters")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .first();

  if (!counter) {
    await ctx.db.insert("project_counters", {
      userId,
      nextProjectNumber: 2,
    });
    return 1;
  }

  const projectNumber = counter.nextProjectNumber;

  await ctx.db.patch(counter._id, {
    nextProjectNumber: projectNumber + 1,
  });

  return projectNumber;
}

export const getProjects = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 20 }) => {
    const allProjects = await ctx.db
      .query("projects")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .collect();

    const projects = allProjects.slice(0, limit);

    return projects.map((project) => ({
      _id: project._id,
      name: project.name,
      projectNumber: project.projectNumber,
      lastModified: project.lastModified,
      createdAt: project.createdAt,
      isPublic: project.isPublic,
      thumbnail: project.thumbnail,
    }));
  },
});

export const getProjectStyleGuide = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const user = await getAuthUserId(ctx);
    if (!user) {
      throw new Error("User not found");
    }

    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.userId !== user && !project.isPublic) {
      throw new Error("Unauthorized");
    }

    return project.styleGuide ? JSON.parse(project.styleGuide) : null;
  },
});

export const updateProjectSketches = mutation({
  args: {
    projectId: v.id("projects"),
    sketchesData: v.any(),
    viewportData: v.optional(v.any()),
  },
  handler: async (ctx, { projectId, sketchesData, viewportData }) => {
    //ingest function runs on server without user auth context
    // so no need to check user for this function

    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const updateData: any = {
      sketchData: sketchesData,
      lastModified: Date.now(),
    };

    if (viewportData) {
      updateData.viewportData = viewportData;
    }

    await ctx.db.patch(projectId, updateData);
    return { success: true };
  },
});

export const updateProjectStyleGuide = mutation({
  args: {
    projectId: v.id("projects"),
    styleGuideData: v.any(),
  },
  handler: async (ctx, { projectId, styleGuideData }) => {
    console.log("[Convex] updating project style guide:", projectId);
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("NotAuthenticated");

    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project now found");
    if (project.userId !== userId) {
      throw new Error("Access denied");
    }

    await ctx.db.patch(projectId, {
      styleGuide: JSON.stringify(styleGuideData),
      lastModified: Date.now(),
    });

    console.log("[Convex] Project style guide updated successfully");
    return { success: true, styleGuide: styleGuideData };
  },
});
