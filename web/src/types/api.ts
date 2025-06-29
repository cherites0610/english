/**
 * 後端 API 標準響應的泛型接口
 */
export interface ResponseDto<T> {
    message: string;
    data: T;
}

// 可以在這裡放一些所有 API 都會用到的 DTO 或 Enum