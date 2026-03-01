import { SubscriptionEntitlementQuery } from "@/convex/query.config";

export default async function Page() {

    const { entitlement } = await SubscriptionEntitlementQuery();

    return (
        <div></div>
    )
}