import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'src/common/dto/response.dto';
import { NpcDto } from './npc.dto';

/**
 * 用於返回單個 NPC 的響應
 */
export class NpcResponse extends ResponseDto<NpcDto> {
  @ApiProperty({ type: NpcDto })
  declare data: NpcDto;
}

/**
 * 用於返回 NPC 列表的響應
 */
export class NpcListResponse extends ResponseDto<NpcDto[]> {
  @ApiProperty({ type: [NpcDto] })
  declare data: NpcDto[];
}
