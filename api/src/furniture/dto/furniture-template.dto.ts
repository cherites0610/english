import { ApiProperty } from '@nestjs/swagger';

/**
 * 用於 API 響應的家具模板數據格式
 */
export class FurnitureTemplateDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  imageUrl: string;

  @ApiProperty()
  width: number;

  @ApiProperty()
  height: number;
}
