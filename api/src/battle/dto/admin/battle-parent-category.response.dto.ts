import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'src/common/dto/response.dto';
import { BattleParentCategoryDto } from './battle-parent-category.dto';

export class BattleParentCategoryResponse extends ResponseDto<BattleParentCategoryDto> {
  @ApiProperty({ type: BattleParentCategoryDto })
  declare data: BattleParentCategoryDto;
}

export class BattleParentCategoryListResponse extends ResponseDto<
  BattleParentCategoryDto[]
> {
  @ApiProperty({ type: [BattleParentCategoryDto] })
  declare data: BattleParentCategoryDto[];
}
