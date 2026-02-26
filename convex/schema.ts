import { componentsGeneric, defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,
  //app tables
  projects: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    styleGuide: v.optional(v.string()),
    sketchData: v.any(), //JSON matching redux shapes state,
    viewportData: v.optional(v.any()), //JSON for viewport state(scale etc)
    generatedDesignData: v.optional(v.any()), //JSON for generated UI
    thumbnail: v.optional(v.string()), //url to thumbnail image
    moodBoardImages: v.optional(v.array(v.string())), //arrays for IDs of moodboard images
    inspirationImages: v.optional(v.array(v.string())), //arrays of storage IDs of inspiration images
    lastModified: v.number(), //timestamp of last modification
    createdAt: v.number(), //timestamp of creation
    isPublic: v.optional(v.boolean()), //for sharing feature
    tags: v.optional(v.array(v.string())), //tags for categorization
    projectNumber: v.number(),
  }).index('by_userId', ['userId']),
  project_counters: defineTable({
    userId: v.id("users"),
    nextProjectNumber: v.number(),
  }).index('by_userId', ['userId']),
  subscriptions: defineTable({
    userId: v.id("users"),
    polarCustomerId: v.string(),
    polarSubscriptionId: v.string(),
    productId: v.optional(v.string()),
    priceId: v.optional(v.string()),
    planCode: v.optional(v.string()),
    status: v.string(),
    currentPeriodEnd: v.optional(v.number()),
    trialEndsAt: v.optional(v.number()),
    cancelAt: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    seats: v.optional(v.number()),
    metadata: v.optional(v.any()),
    creditBalance: v.number(),
    cerditsGrantPerPeriod: v.number(),
    creditsRolloverLimit: v.number(),
    lastGrantCursor: v.optional(v.string()),
  })
  .index('by_userId', ['userId'])
  .index('by_polarSubscriptionId', ['polarSubscriptionId'])
  .index('by_status', ['status']),
  creditsLedger: defineTable({
    userId: v.id("users"),
    subscriptionId: v.id("subscriptions"),
    amount: v.number(),
    type: v.string(), // grant|consume|adjust
    reason: v.optional(v.string()),
    idempotencyKey: v.optional(v.string()),
    meta: v.optional(v.any()),
  })
  .index('by_subscriptionId', ['subscriptionId'])
  .index('by_userId', ['userId'])
  .index('by_idempotencyKey', ['idempotencyKey'])
});

export default schema;
