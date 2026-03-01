import Navbar from "@/components/navbar/Navbar";
import { SubscriptionEntitlementQuery } from "@/convex/query.config";
import { combineSlug } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const { entitlement, profileName } = await SubscriptionEntitlementQuery();

  // if (!entitlement._valueJSON) {
  //   redirect(`/client/${combineSlug(profileName!)}`);
  // }

  return (
    <div className="grid grid-cols-1">
      <Navbar />
      {children}
    </div>
  );
}
