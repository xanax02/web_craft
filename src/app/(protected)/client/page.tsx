import { SubscriptionEntitlementQuery } from "@/convex/query.config";
import { combineSlug } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function Page() {
  const { entitlement, profileName } = await SubscriptionEntitlementQuery();

  console.log("entitlement", entitlement);
  //   console.log("profileName", profileName);

  if (!entitlement._valueJSON) {
    return redirect(`/billing/${combineSlug(profileName!)}`);
  }

  return redirect(`/client/${combineSlug(profileName!)}`);
}
