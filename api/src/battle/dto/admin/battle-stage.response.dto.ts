import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'src/common/dto/response.dto';
import { BattleStageDto } from './battle-stage.dto';

export class BattleStageResponse extends ResponseDto<BattleStageDto> {
    @ApiProperty({ type: BattleStageDto })
    declare data: BattleStageDto;
}

export class BattleStageListResponse extends ResponseDto<BattleStageDto[]> {
    @ApiProperty({ type: [BattleStageDto] })
    declare data: BattleStageDto[];
}