import { fetchMutation, fetchQuery } from "convex/nextjs";
import { inngest } from "./client";
import { api } from "../../convex/_generated/api";
import {
  extractOrderLike,
  extractSubscriptionLike,
  isPolarWebhookEvent,
  PolarOrder,
  PolarSubsription,
  ReceivedEvent,
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

export const handlePolarEvent = inngest.createFunction(
  { id: "polar-webhook-handler" },
  { event: "polar/webhook.received" },
  async ({ event, step }) => {
    console.log("[Inngest] Starting Polar webhook handler");
    console.log(
      "[Inngest] Raw event data:",
      JSON.stringify(event.data, null, 2),
    );

    if (!isPolarWebhookEvent(event.data)) {
      return;
    }

    const incoming = event.data as ReceivedEvent;
    const type = incoming.type;
    const dataUnknown = incoming.data;

    const sub: PolarSubsription | null = extractSubscriptionLike(dataUnknown);

    const order: PolarOrder | null = extractOrderLike(dataUnknown);

    if (!sub && !order) return;

    const userId: Id<"users"> | null = await step.run(
      "resolve-user",
      async () => {
        const metaUserId =
          (sub?.metadata?.userId as string | undefined) ??
          (order?.metadata?.userId as string | undefined);

        if (metaUserId) {
          console.log("[Inngest] Using metadata userId:", metaUserId);
          return metaUserId as unknown as Id<"users">;
        }

        const email = sub?.customer?.email ?? order?.customer?.email ?? null;
        console.log("[Inngest] Customer email:", email);
        if (email) {
          try {
            console.log("[Inngest] Looking up user by email:", email);
            const foundUserId = await fetchQuery(api.user.getUserIdByEmail, {
              email,
            });

            console.log("[Inngest] Found user by email:", foundUserId);
            return foundUserId;
          } catch (error) {}
        }
      },
    );
  },
);
