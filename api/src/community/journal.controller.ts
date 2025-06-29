import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { JournalService } from './journal.service';
import { CreateJournalDto, UpdateJournalDto } from './dto/journal.dto';
import { UserID } from 'src/common/decorators/user.decorator';
import { Public } from 'src/common/decorators/public.decorator'; // 用於公開端點

// --- Swagger 和響應 DTO 相關的 imports ---
import { ApiTags, ApiBearerAuth, ApiOkResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiForbiddenResponse, ApiQuery } from '@nestjs/swagger';
import { JournalEntryResponse, JournalEntryListResponse } from './dto/journal.response.dto';
import { SuccessResponse } from 'src/common/dto/success.response.dto';

@ApiTags('Journal')
@Controller('journal')
export class JournalController {
    constructor(private readonly journalService: JournalService) { }

    @Post()
    @ApiBearerAuth()
    @ApiCreatedResponse({ description: '成功創建日誌', type: JournalEntryResponse })
    async create(
        @UserID() authorId: string,
        @Body() createJournalDto: CreateJournalDto,
    ): Promise<JournalEntryResponse> {
        const journal = await this.journalService.create(authorId, createJournalDto);
        return { message: '日誌已成功發布', data: journal };
    }

    @Get('user/:userId')
    @ApiOkResponse({ description: '成功獲取用戶的日誌列表', type: JournalEntryListResponse })
    async findByUser(
        @Param('userId') ownerId: string,
        @UserID() viewerId: string,
    ): Promise<JournalEntryListResponse> {
        const journals = await this.journalService.findByUser(ownerId, viewerId);
        return { message: '查詢成功', data: journals };
    }

    @Get(':id')
    @ApiOkResponse({ description: '成功獲取單篇日誌詳情', type: JournalEntryResponse })
    @ApiNotFoundResponse({ description: '找不到指定的日誌' })
    @ApiForbiddenResponse({ description: '無權查看該日誌' })
    async findOne(
        @Param('id') id: string,
        @UserID() viewerId: string,
    ): Promise<JournalEntryResponse> {
        const journal = await this.journalService.findOne(id, viewerId);
        return { message: '查詢成功', data: journal };
    }

    @Patch(':id')
    @ApiBearerAuth()
    @ApiOkResponse({ description: '成功更新日誌', type: JournalEntryResponse })
    @ApiNotFoundResponse({ description: '找不到指定的日誌' })
    @ApiForbiddenResponse({ description: '無權修改該日誌' })
    async update(
        @Param('id') id: string,
        @UserID() authorId: string,
        @Body() updateJournalDto: UpdateJournalDto,
    ): Promise<JournalEntryResponse> {
        const updatedJournal = await this.journalService.update(authorId, id, updateJournalDto);
        return { message: '日誌已更新', data: updatedJournal };
    }

    @Delete(':id')
    @ApiBearerAuth()
    @ApiOkResponse({ description: '成功刪除日誌', type: SuccessResponse })
    @ApiNotFoundResponse({ description: '找不到指定的日誌' })
    @ApiForbiddenResponse({ description: '無權刪除該日誌' })
    async remove(@Param('id') id: string, @UserID() authorId: string): Promise<SuccessResponse> {
        await this.journalService.remove(authorId, id);
        return { message: '日誌已成功刪除', data: null };
    }
}