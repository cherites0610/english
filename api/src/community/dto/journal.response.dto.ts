import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'src/common/dto/response.dto';
import { JournalEntryDto } from './journal.dto';

// 返回單篇日誌的響應
export class JournalEntryResponse extends ResponseDto<JournalEntryDto> {
    @ApiProperty({ type: JournalEntryDto })
    declare data: JournalEntryDto;
}

// 返回日誌列表的響應
export class JournalEntryListResponse extends ResponseDto<JournalEntryDto[]> {
    @ApiProperty({ type: [JournalEntryDto] })
    declare data: JournalEntryDto[];
}