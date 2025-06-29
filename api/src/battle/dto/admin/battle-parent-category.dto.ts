import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * 創建父對戰類型的請求體格式
 */
export class CreateBattleParentCategoryDto {
    @ApiProperty({ description: '父分類名稱', example: '交通工具' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: '父分類的描述', required: false, example: '與各式交通工具有關的挑戰' })
    @IsOptional()
    @IsString()
    description?: string;
}

/**
 * 更新父對戰類型的請求體格式
 */
export class UpdateBattleParentCategoryDto extends PartialType(CreateBattleParentCategoryDto) { }

/**
 * 用於 API 響應的父對戰類型數據格式
 */
export class BattleParentCategoryDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty({ nullable: true })
    description?: string;
}