import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { preloadQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { ConvexUserRaw, normalizeProfile } from "@/types/user";
import { Id } from "../../convex/_generated/dataModel";

export const ProfileQuery = async () => {
  return await preloadQuery(
    api.user.getCurrentUser,
    {},
    { token: await convexAuthNextjsToken() },
  );
};

export const SubscriptionEntitlementQuery = async () => {
  const rawProfileData = await ProfileQuery();

  const profile = normalizeProfile(
    rawProfileData._valueJSON as unknown as ConvexUserRaw | null,
  );

  const entitlement = await preloadQuery(
    api.subscription.hasEntitlement,
    { userId: profile?.id as Id<"users"> },
    { token: await convexAuthNextjsToken() },
  );

  return {
    entitlement,
    profileName: profile?.name,
  };
};
