import apiClient, { ApiResponse } from "./apiClient"
import { fetchPenddingFriendListResponse, Friend } from '../types/friend.type'
import { UserProfileData } from "../types/user.type"


export const fetchFriendList = async (): Promise<Friend[]> => {
    try {
        const response = await apiClient.get<ApiResponse<UserProfileData[]>>('/friend-ship')
        return response.data.data.map((item) => {
            return {
                ...item,
                isOnline: true
            }
        })
    } catch (error) {
        console.error('獲取好友列表失敗:', error);
        throw error;
    }
}

export const fetchPenddingFriendList = async (): Promise<Friend[]> => {
    try {
        const response = await apiClient.get<ApiResponse<fetchPenddingFriendListResponse[]>>('/friend-ship/pending')
        return response.data.data.map(friend => {
            return {
                id: friend.requester.id,
                name: friend.requester.name,
                avatarUrl: friend.requester.avatarUrl,
                isOnline: true
            }
        })
    } catch (error) {
        console.error('獲取好友邀請列表失敗:', error);
        throw error;
    }
}

export const acceptFriendRequest = async (requesterID: string) => {
    try {
        await apiClient.patch("/friend-ship/respond", {
            requesterID: requesterID,
            status: "accepted"
        })
    } catch (error) {
        console.error('接受好友邀請失敗:', error);
        throw error;
    }
}

export const rejectFriendRequest = async (requesterID: string) => {
    try {
        await apiClient.patch("/friend-ship/respond", {
            requesterID: requesterID,
            status: "reject"
        })
    } catch (error) {
        console.error('接受好友邀請失敗:', error);
        throw error;
    }
}

export const deleteFriendRequest = async (friendID: string) => {
    try {
        await apiClient.delete(`friend-ship/friend/${friendID}`)
    } catch (error) {
        console.error('刪除好友失敗:', error);
        throw error;
    }
}

export const queryUser = async (param: string) => {
    try {
        const users = await apiClient.get<ApiResponse<UserProfileData[]>>(`/user/${param}`)
        return users.data.data
    } catch (error) {
        console.error('刪除好友失敗:', error);
        throw error;
    }
}

export const addFriend = async (addressId: string) => {
    try {
        await apiClient.post(`/friend-ship/request`, {
            addresseeID: addressId
        })
    } catch (error:any) {
        console.error('添加好友失敗:', error.response.data.message);
        throw error.response.data.message;
    }
}