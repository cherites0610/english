import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'src/common/dto/response.dto';

// 為了在 FurnitureDto 中內嵌，我們先定義一個簡化的模板 DTO
class FurnitureTemplateSubDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  imageUrl: string;

  @ApiProperty()
  width: number;

  @ApiProperty()
  height: number;
}

/**
 * 代表單個家具實例的公開數據格式（包含模板資訊）
 */
export class FurnitureDto {
  @ApiProperty({ description: '家具實例的唯一ID' })
  id: string;

  @ApiProperty({ description: '在小屋中的 X 座標', nullable: true })
  x?: number;

  @ApiProperty({ description: '在小屋中的 Y 座標', nullable: true })
  y?: number;

  @ApiProperty({ description: '家具的旋轉角度' })
  rotation: number;

  @ApiProperty({ type: FurnitureTemplateSubDto, description: '家具的模板資訊' })
  template: FurnitureTemplateSubDto;
}

export class FurnitureResponse extends ResponseDto<FurnitureDto> {
  @ApiProperty({ type: FurnitureDto })
  declare data: FurnitureDto;
}

/**
 * 用於返回家具列表的響應 DTO
 */
export class FurnitureListResponse extends ResponseDto<FurnitureDto[]> {
  @ApiProperty({ type: [FurnitureDto] })
  declare data: FurnitureDto[];
}
