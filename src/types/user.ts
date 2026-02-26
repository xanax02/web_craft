import { combineSlug } from "@/lib/utils"

export type ConvexUserRaw = {
    _creationTime: number
    _id: string
    email: string
    emailVerificationTime?: number
    image?: string
    name?: string
}

export type Profile = {
    id: string
    createdAtMs: number
    email: string
    emailVerficationAtMs?: number
    image?: string
    name?: string
}

export const normalizeProfile = (
    rawProfileData: ConvexUserRaw | null
) : Profile | null => {
   if(!rawProfileData) return null ;

   const extractNameFromEmail = (email: string): string => {
    const username =  email.split('@')[0]
    return  username
        .split(/[._-]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ')
   }

   const name = combineSlug(rawProfileData.name || extractNameFromEmail(rawProfileData.email))

   return {
    id: rawProfileData._id,
    createdAtMs: rawProfileData._creationTime,
    email: rawProfileData.email,
    emailVerficationAtMs: rawProfileData.emailVerificationTime,
    image: rawProfileData.image,
    name: name,
   }
}