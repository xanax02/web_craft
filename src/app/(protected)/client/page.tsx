import { SubscriptionEntitlementQuery } from "@/convex/query.config";
import { combineSlug } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function Page() {
  const { entitlement, profileName } = await SubscriptionEntitlementQuery();

  //TODO : Uncomment this after dev cycle to implement subsciption based access;
  // if (!entitlement._valueJSON) {
  //   return redirect(`/billing/${combineSlug(profileName!)}`);
  // }

  return redirect(`/client/${combineSlug(profileName!)}`);
}
