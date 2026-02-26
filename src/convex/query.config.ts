import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server"
import { preloadQuery } from 'convex/nextjs'
import { api } from "../../convex/_generated/api"

export const ProfileQuery = async() => {
    return await preloadQuery(
        api.user.getCurrentUser,
        {},
        { token: await convexAuthNextjsToken()}
    )
}

export const SubscriptionEntitlementQuery = () => {
    const rawProfileData = await ProfileQuery()

    const profile = normalizeProfile(rawProfileData._valueJSON as unknown as ConvexUserRaw | null)
}