export enum UserQuestStatus {
  IN_PROGRESS = 'IN_PROGRESS', // 進行中
  COMPLETED = 'COMPLETED', // 已完成，待領取獎勵
  CLAIMED = 'CLAIMED', // 已領取獎勵
  EXPIRED = 'EXPIRED', // (可選) 已過期
}
