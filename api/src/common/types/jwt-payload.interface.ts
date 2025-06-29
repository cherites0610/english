// 定義您的 JWT payload 中包含的數據
export interface JwtPayload {
  // 主體，通常是使用者的唯一 ID
  sub: string;

  // 為了方便，我們通常也會把 userId 直接放在 payload 中
  userId: string;

  // 您也可以放 role, username 等其他資訊
  // username: string;
  // roles: Role[];
}

// 這是最關鍵的一步：擴展 Express 的 Request 介面
// 告訴 TypeScript，我們的 Request 物件上會有一個 user 屬性，其類型為 JwtPayload
declare global {
  namespace Express {
    export interface Request {
      user?: JwtPayload;
    }
  }
}
