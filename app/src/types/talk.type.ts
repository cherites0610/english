type AIMessage = {
    role: 'ASSISTANT',
    content: string,
    audioBase64: string,
    audioFormat: 'audio/mpeg'
}

type UserMessage = {
    role: 'USER',
    content: string,
}

export type createTalkResponse = {
    talkID: string,
    message: AIMessage
}

export type addMessageResponse = {
    userMessage: UserMessage,
    assistantMessage: AIMessage
}