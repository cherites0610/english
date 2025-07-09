import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'src/common/dto/response.dto';
import { BattleChildCategoryDto } from './battle-child-category.dto';

export class BattleChildCategoryResponse extends ResponseDto<BattleChildCategoryDto> {
  @ApiProperty({ type: BattleChildCategoryDto })
  declare data: BattleChildCategoryDto;
}

export class BattleChildCategoryListResponse extends ResponseDto<
  BattleChildCategoryDto[]
> {
  @ApiProperty({ type: [BattleChildCategoryDto] })
  declare data: BattleChildCategoryDto[];
}
