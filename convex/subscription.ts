import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const DEFAULT_GRANT = 10;
const DEFAULT_ROLLOVER = 100;
const ENTITLED = new Set(["active", "trailing"]);

export const hasEntitlement = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const date = Date.now();
    for await (const sub of ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))) {
      const status = String(sub.status || "").toLowerCase();
      const periodOk =
        sub.currentPeriodEnd == null || sub.currentPeriodEnd > date;
      if (status === "active" && periodOk) {
        return true;
      }
    }
    return false;
  },
});

export const getPolarById = query({
  args: { polarSubscriptionId: v.string() },
  handler: async (ctx, { polarSubscriptionId }) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_polarSubscriptionId", (q) =>
        q.eq("polarSubscriptionId", polarSubscriptionId),
      )
      .first();
  },
});

export const getSubscriptionForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

export const upsertByPolar = mutation({
  args: {
    userId: v.id("users"),
    polarSubsriptionId: v.string(),
    polarCutomerId: v.string(),
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
    creditsGrantPerPeriod: v.optional(v.number()),
    creditsRolloverLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existingByPolar = await ctx.db
      .query("subscriptions")
      .withIndex("by_polarSubscriptionId", (q) =>
        q.eq("polarSubscriptionId", args.polarSubsriptionId),
      )
      .first();

    const existingByUser = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    const base = {
      userId: args.userId,
      polarSubscriptionId: args.polarSubsriptionId,
      polarCustomerId: args.polarCutomerId,
      productId: args.productId,
      priceId: args.priceId,
      planCode: args.planCode,
      status: args.status,
      currentPeriodEnd: args.currentPeriodEnd,
      trialEndsAt: args.trialEndsAt,
      cancelAt: args.cancelAt,
      canceledAt: args.canceledAt,
      seats: args.seats,
      metadata: args.metadata,
      cerditsGrantPerPeriod:
        args.creditsGrantPerPeriod ??
        existingByPolar?.cerditsGrantPerPeriod ??
        existingByUser?.cerditsGrantPerPeriod ??
        DEFAULT_GRANT,
      creditsRolloverLimit:
        args.creditsRolloverLimit ??
        existingByPolar?.creditsRolloverLimit ??
        existingByUser?.creditsRolloverLimit ??
        DEFAULT_ROLLOVER,
    };

    if (existingByPolar) {
      if (existingByPolar.userId === args.userId) {
        await ctx.db.patch(existingByPolar._id, base);
        return existingByPolar._id;
      } else {
        const existingSubscription = await ctx.db
          .query("subscriptions")
          .withIndex("by_userId", (q) => q.eq("userId", args.userId))
          .first();
        if (existingSubscription) {
          const preservedData = {
            creditsBalance: existingSubscription.creditBalance,
            lastGrantCursor: existingSubscription.lastGrantCursor,
          };
          await ctx.db.patch(existingSubscription._id, {
            ...base,
            ...preservedData,
          });

          return existingSubscription._id;
        } else {
          const newId = await ctx.db.insert("subscriptions", {
            ...base,
            creditBalance: 0,
            lastGrantCursor: undefined,
          });
          return newId;
        }
      }
    }

    if (existingByUser) {
      const preservedData = {
        creditsBalance: existingByUser.creditBalance,
        lastGrantCursor: existingByUser.lastGrantCursor,
      };
      await ctx.db.patch(existingByUser._id, {
        ...base,
        ...preservedData,
      });

      const newId = await ctx.db.insert("subscriptions", {
        ...base,
        creditBalance: 0,
        lastGrantCursor: undefined,
      });

      return newId;
    }
  },
});

export const getAllForUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return subscriptions;
  },
});

// export const grantCreditsIfNeeded = mutation({
//   args: {
//     subscriptionId: v.id("subscriptions"),
//     idempotencyKey: v.string(),
//     amount: v.optional(v.number()),
//     reason: v.optional(v.string()),
//   },
//   handler: async (ctx, { subscriptionId, idempotencyKey, amount, reason }) => {
//     const dup = await ctx.db
//       .query("creditsLedger")
//       .withIndex("by_idempotencyKey", (q) =>
//         q.eq("idempotencyKey", idempotencyKey),
//       )
//       .first();

//     if (dup) {
//       return { ok: true, skipped: true, reason: "duplicate-ledger" };
//     }

//     const sub = await ctx.db.get(subscriptionId);
//     if (!sub) return { ok: false, reason: "subscription-not-found" };

//     if (sub.lastGrantCursor === idempotencyKey) {
//       return { ok: true, skipped: true, reason: "cursor-match" };
//     }

//     if (!ENTITLED.has(sub.status)) {
//       return { ok: true, skipped: true, reason: "not-entitled" };
//     }

//     const grant = amount ?? sub.cerditsGrantPerPeriod ?? DEFAULT_GRANT;
//     if (grant <= 0) {
//       return { ok: true, skipped: true, reason: "zero-grant" };
//     }

//     const next = Math.min(
//       sub.creditBalance + grant,
//       sub.creditsRolloverLimit ?? DEFAULT_ROLLOVER,
//     );

//     await ctx.db.patch(subscriptionId, {
//       creditBalance: next,
//       lastGrantCursor: idempotencyKey,
//     });

//     await ctx.db.insert("creditsLedger", {
//       subscriptionId,
//       idempotencyKey,
//       amount: grant,
//       reason: reason || "periodic-grant",
//       userId: sub.userId,
//       type: "grant",
//       meta: { prev: sub.creditBalance, next },
//     });

//     return { ok: true, granted: grant, balance: next };
//   },
// });

export const ConsumeCredits = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    reason: v.optional(v.string()),
    idempotencyKey: v.optional(v.string()),
  },
  handler: async (ctx, { userId, amount, reason, idempotencyKey }) => {
    if (amount <= 0) return { ok: false, error: "invalid-amount" };

    if (idempotencyKey) {
      const dupe = await ctx.db
        .query("creditsLedger")
        .withIndex("by_idempotencyKey", (q) =>
          q.eq("idempotencyKey", idempotencyKey),
        )
        .first();

      if (dupe) {
        return { ok: true, idempotent: true };
      }
    }

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!sub) {
      return { ok: false, error: "no-subscription" };
    }

    if (!ENTITLED.has(sub.status)) return { ok: false, error: "not-entitled" };

    if (sub.creditBalance < amount) {
      return {
        ok: false,
        error: "insufficient-credits",
        balance: sub.creditBalance,
      };
    }

    const next = (sub.creditBalance = amount);
    await ctx.db.patch(sub._id, { creditBalance: next });

    await ctx.db.insert("creditsLedger", {
      userId,
      subscriptionId: sub._id,
      amount: -amount,
      type: "consume",
      reason: reason ?? "usage",
      idempotencyKey,
      meta: { prev: sub.creditBalance, next },
    });

    return { ok: true, balance: next };
  },
});
