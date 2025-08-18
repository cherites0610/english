import { fetchMailResponse, Mail } from "../types/mail.type"
import apiClient, { ApiResponse } from "./apiClient"

export const fetchMail = async (): Promise<Mail[]> => {
    try {
        const response = await apiClient.get<ApiResponse<fetchMailResponse[]>>('/mail');
        const mails = response.data.data
        
        return mails.map(mail => {
            return {
                id: mail.id,
                sender: mail.from,
                title: mail.title,
                isRead: mail.isRead,
                receivedAt: mail.receivedAt
            }
        })
    } catch (err) {
        console.log(err);
        return []
    }
}

export const readMailRequest = async (id: string): Promise<boolean> => {
    try {
        const response = await apiClient.patch(`/mail/read/${id}`)
        return true
    } catch {
        return false
    }
}