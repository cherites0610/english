import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { BattleParentCategoryDto } from './battle-parent-category.dto';

/**
 * 創建子對戰類型的請求體格式
 */
export class CreateBattleChildCategoryDto {
    @ApiProperty({ description: '子分類名稱', example: '公車' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: '子分類的描述', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: '所屬父分類的 ID' })
    @IsUUID()
    parentId: string;
}

/**
 * 更新子對戰類型的請求體格式
 */
export class UpdateBattleChildCategoryDto extends PartialType(CreateBattleChildCategoryDto) { }

/**
 * 用於 API 響應的子對戰類型數據格式 (包含父分類資訊)
 */
export class BattleChildCategoryDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty({ nullable: true })
    description?: string;

    @ApiProperty({ type: () => BattleParentCategoryDto })
    parent: BattleParentCategoryDto;
}