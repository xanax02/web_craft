import { fetchMutation, fetchQuery } from "convex/nextjs";
import { inngest } from "./client";
import { api } from "../../convex/_generated/api";
import {
  extractOrderLike,
  extractSubscriptionLike,
  isEntitledStatus,
  isPolarWebhookEvent,
  PolarOrder,
  PolarSubsription,
  ReceivedEvent,
  toMs,
} from "@/types/polar";
import { Id } from "../../convex/_generated/dataModel";

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

const grantKey = (
  subId: string,
  periodEndMs: number | undefined,
  eventId?: string | number,
): string =>
  periodEndMs != null
    ? `${subId}: ${periodEndMs}`
    : eventId != null
      ? `${subId}:evt:${eventId}`
      : `${subId}: first`;

// export const handlePolarEvent = inngest.createFunction(
//   { id: "polar-webhook-handler" },
//   { event: "polar/webhook.received" },
//   async ({ event, step }) => {
//     console.log("[Inngest] Starting Polar webhook handler");
//     console.log(
//       "[Inngest] Raw event data:",
//       JSON.stringify(event.data, null, 2),
//     );

//     if (!isPolarWebhookEvent(event.data)) {
//       return;
//     }

//     const incoming = event.data as ReceivedEvent;
//     const type = incoming.type;
//     const dataUnknown = incoming.data;

//     const sub: PolarSubsription | null = extractSubscriptionLike(dataUnknown);

//     const order: PolarOrder | null = extractOrderLike(dataUnknown);

//     if (!sub && !order) return;

//     const userId: Id<"users"> | null = await step.run(
//       "resolve-user",
//       async () => {
//         const metaUserId =
//           (sub?.metadata?.userId as string | undefined) ??
//           (order?.metadata?.userId as string | undefined);

//         if (metaUserId) {
//           console.log("[Inngest] Using metadata userId:", metaUserId);
//           return metaUserId as unknown as Id<"users">;
//         }

//         const email = sub?.customer?.email ?? order?.customer?.email ?? null;
//         console.log("[Inngest] Customer email:", email);
//         if (email) {
//           try {
//             console.log("[Inngest] Looking up user by email:", email);
//             const foundUserId = await fetchQuery(api.user.getUserIdByEmail, {
//               email,
//             });

//             console.log("[Inngest] Found user by email:", foundUserId);
//             return foundUserId;
//           } catch (error) {
//             console.error("[Inngest] Error looking up user by email:", error);
//             return null;
//           }
//         }
//         console.log("[Inngest] No user found for Polar event");
//         return null;
//       },
//     );
//     console.log("[Inngest] Resolved user ID:", userId);
//     if (!userId) {
//       console.log("[Inngest] No user ID found, skipping subscription update");
//       return;
//     }

//     const polarSubsriptionId = sub?.id ?? order?.subscription_id ?? null;
//     console.log("[Inngest] Polar subscription ID:", polarSubsriptionId);

//     if (!polarSubsriptionId) {
//       console.log(
//         "[Inngest] No Polar subscription ID found, skipping subscription update",
//       );
//       return;
//     }

//     const currentPeriodEnd = toMs(sub?.current_period_end);

//     const payload = {
//       userId,
//       polarSubsriptionId,
//       polarCutomerId:
//         sub?.customer?.id ?? sub?.customer_id ?? order?.customer_id ?? "",
//       productId: sub?.product_id ?? sub?.product?.id ?? undefined,
//       priceId: sub?.prices?.[0]?.id ?? undefined,
//       planCode: sub?.plan_code ?? sub?.product?.name ?? undefined,
//       status: sub?.status ?? "updated",
//       currentPeriodEnd,
//       trialEndsAt: toMs(sub?.trail_ends_at),
//       cancelAt: toMs(sub?.cancel_at),
//       canceledAt: toMs(sub?.canceled_at),
//       seats: sub?.seats ?? undefined,
//       metadata: dataUnknown,
//       creditsGrantPerPeriod: 10,
//       creditsRolloverLimit: 100,
//     };

//     console.log(
//       "[Inngest] subscription payload",
//       JSON.stringify(payload, null, 2),
//     );

//     const subscriptionId = await step.run("update-subscription", async () => {
//       try {
//         console.log("[Inngest] Upserting subscription to convex...");
//         console.log("[Inngest] checking for existing subscription...");

//         const existingByPolar = await fetchQuery(
//           api.subscription.getPolarById,
//           {
//             polarSubscriptionId: payload.polarSubsriptionId,
//           },
//         );
//         console.log("[Inngest] Existing subscription:", existingByPolar);

//         const existingByUser = await fetchQuery(
//           api.subscription.getSubscriptionForUser,
//           {
//             userId: payload?.userId,
//           },
//         );

//         console.log("[Inngest] Existing subscription by user:", existingByUser);

//         if (existingByPolar && existingByUser) {
//           console.warn("[Inngest] duplicate detected: ");
//           console.log(" - BY polar id", existingByPolar._id);
//           console.log(" - BY user id", existingByUser._id);
//         }

//         const result = await fetchMutation(
//           api.subscription.upsertByPolar,
//           payload,
//         );

//         const allUserSubs = await fetchQuery(api.subscription.getAllForUser, {
//           userId: payload.userId,
//         });
//         // console.log("[Inngest] All user subscriptions:", allUserSubs);
//         // if (existingByPolar) {
//         //   console.log("[Inngest] Updating existing subscription...");
//         //   await fetchMutation(api.subscription.update, {
//         //     id: existingByPolar._id,
//         //     ...payload,
//         //   });
//         // } else {
//         //   console.log("[Inngest] Creating new subscription...");
//         //   await fetchMutation(api.subscription.create, payload);
//         // }

//         if (allUserSubs && allUserSubs.length > 1) {
//           allUserSubs.forEach((sub, index) => {
//             console.log(`[Inngest] Subscription ${index}:`, sub.status);
//           });
//         }

//         return result;
//       } catch (error) {
//         console.error("[Inngest] Error upserting subscription:", error);
//         throw error;
//       }
//     });

//     const lookCreate = /subscription\.created/.test(type);
//     const lookRenew =
//       /subscription\.renew|order\.created|invoice\.paid|order\.paid/.test(type);

//     const entitled = isEntitledStatus(payload.status);

//     console.log("- Event type ", type);
//     console.log(" - Look like created", lookCreate);
//     console.log(" - Look like renew", lookRenew);
//     console.log(" - Entitled", entitled);
//     console.log(" - Status", payload.status);

//     const idk = grantKey(polarSubsriptionId, currentPeriodEnd, incoming.id);

//     console.log(" - Idempotency key", idk);

//     if (entitled && (lookCreate || lookRenew || true)) {
//       const grant = await step.run("grant-credits", async () => {
//         try {
//           console.log("[Inngest] Granting credits...");
//           const result = await fetchMutation(
//             api.subscription.grantCreditsIfNeeded,
//             {
//               subscriptionId,
//               idempotencyKey: idk,
//               amount: 10,
//               reason: lookCreate ? "initial-grant" : "periodic-grant",
//             },
//           );
//           return result;
//         } catch (error) {
//           console.error("[Inngest] Error granting credits:", error);
//           throw error;
//         }
//       });

//       console.log("[Inngest] grant result: ", grant);
//       if (grant.ok && !("skipped" in grant && grant.skipped)) {
//         await step.sendEvent("credit-granted", {
//           name: "billing/credits.granted",
//           id: `credits-granted:${polarSubsriptionId}:${currentPeriodEnd ?? "first"}`,
//           data: {
//             userId,
//             amount: "granted" in grant ? (grant.granted ?? 10) : 10,
//             balance: "balance" in grant ? grant.balance : undefined,
//             periodEnd: currentPeriodEnd,
//           },
//         });
//         console.log("[Inngest]: Credit grant event seent");
//       } else {
//         console.log("[Inngest]: Credit grant skipped");
//       }
//     } else {
//       console.log("[Inngest] credit granting codition not met");
//     }

//     await step.sendEvent("sub-synced", {
//       name: "billing/subscription.synced",
//       id: `sub-synced:${polarSubsriptionId}:${currentPeriodEnd ?? "first"}`,
//       data: {
//         userId,
//         polarSubsriptionId,
//         status: payload.status,
//         currentPeriodEnd,
//       },
//     });

//     console.log("[Inngest] Subscription synced event sent");
//     if (currentPeriodEnd && currentPeriodEnd > Date.now()) {
//       const runAt = new Date(
//         Math.max(Date.now() + 5000, currentPeriodEnd - 3 * 24 * 60 * 60 * 1000),
//       );
//       await step.sleepUntil("wait-before-renew", runAt);
//       const stillEntitled = await step.run("check-entitlement", async () => {
//         console.log("[Inngest] Still entitled: ", stillEntitled);
//         try {
//           const result = await fetchQuery(api.subscription.hasEntitlement, {
//             userId,
//           });
//           return result;
//         } catch (error) {
//           console.error("[Inngest] Error checking entitlement:", error);
//           throw error;
//         }
//       });

//       if (stillEntitled) {
//         await step.sendEvent("pre-expiry", {
//           name: "billing/subscription.pre_expiry",
//           data: {
//             userId,
//             runAt: runAt.toISOString(),
//             periodEnd: currentPeriodEnd,
//           },
//         });
//       }
//     }
//   },
// );
