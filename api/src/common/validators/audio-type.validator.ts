import { FileValidator } from '@nestjs/common';

// 定義我們的驗證器需要的選項類型
export type AudioTypeValidatorOptions = {
    allowedTypes: string[]; // 一個包含所有允許的 MIME 類型的字串陣列
};

export class AudioTypeValidator extends FileValidator<AudioTypeValidatorOptions> {
    constructor(protected readonly validationOptions: AudioTypeValidatorOptions) {
        // 必須調用 super()，可以傳入空物件
        super({
            allowedTypes: ['audio/mpeg', 'audio/webm', 'audio/ogg']
        });
    }

    /**
     * 這是核心的驗證邏輯
     * @param file Express.Multer.File 物件
     * @returns 如果檔案類型合法則返回 true，否則返回 false
     */
    public isValid(file?: Express.Multer.File): boolean {
        // 如果沒有檔案，視為有效（讓其他驗證器如 MaxFileSizeValidator 處理）
        if (!file) {
            return true;
        }
        // 檢查檔案的 mimetype 是否在我們允許的列表內
        return this.validationOptions.allowedTypes.includes(file.mimetype);
    }

    /**
     * 當驗證失敗時，返回的錯誤訊息
     * @returns 錯誤訊息字串
     */
    public buildErrorMessage(): string {
        return `檔案驗證失敗：只允許上傳以下類型檔案：${this.validationOptions.allowedTypes.join(
            ', ',
        )}`;
    }
}