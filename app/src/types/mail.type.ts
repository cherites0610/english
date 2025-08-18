export type Mail = {
    id: string;
    sender: string;
    title: string;
    isRead: boolean;
    receivedAt: string;
};

export type fetchMailResponse = {
    id: string
    title: string;
    context:string;
    from: string;
    isRead: boolean;
    receivedAt: string
};

