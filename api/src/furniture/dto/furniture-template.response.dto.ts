import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'src/common/dto/response.dto';
import { FurnitureTemplateDto } from './furniture-template.dto';

// 返回單個家具模板的響應
export class FurnitureTemplateResponse extends ResponseDto<FurnitureTemplateDto> {
  @ApiProperty({ type: FurnitureTemplateDto })
  declare data: FurnitureTemplateDto;
}

// 返回家具模板列表的響應
export class FurnitureTemplateListResponse extends ResponseDto<
  FurnitureTemplateDto[]
> {
  @ApiProperty({ type: [FurnitureTemplateDto] })
  declare data: FurnitureTemplateDto[];
}
