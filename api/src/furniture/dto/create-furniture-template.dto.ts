import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, IsUrl } from 'class-validator';

export class CreateFurnitureTemplateDto {
    @ApiProperty({ description: '家具名稱', example: '舒適的單人床' })
    @IsString()
    name: string;

    @ApiProperty({ description: '家具的圖片 URL', example: 'https://example.com/bed.png' })
    @IsUrl()
    imageUrl: string;

    @ApiProperty({ description: '家具的詳細描述', example: '一張柔軟的床，能讓你忘卻一天的疲勞。' })
    @IsString()
    description: string;

    @ApiProperty({ description: '家具佔用的格子寬度', example: 2 })
    @IsInt()
    @Min(1)
    width: number;

    @ApiProperty({ description: '家具佔用的格子高度', example: 3 })
    @IsInt()
    @Min(1)
    height: number;
}