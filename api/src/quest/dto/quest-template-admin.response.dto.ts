import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'src/common/dto/response.dto';
import { QuestTemplateDto } from './quest-template-admin.dto';

export class QuestTemplateResponse extends ResponseDto<QuestTemplateDto> {
  @ApiProperty({ type: QuestTemplateDto })
  declare data: QuestTemplateDto;
}

export class QuestTemplateListResponse extends ResponseDto<QuestTemplateDto[]> {
  @ApiProperty({ type: [QuestTemplateDto] })
  declare data: QuestTemplateDto[];
}
