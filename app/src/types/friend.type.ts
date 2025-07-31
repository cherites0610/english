import { UserProfileData } from "./user.type"

export type fetchPenddingFriendListResponse = {
    friendshipId: string,
    requester: UserProfileData,
    requestedAt: Date
}


export type Friend = {
    id: string,
    name: string,
    avatarUrl: string,
    isOnline: boolean
}