import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WallService } from './wall.service';
import { InteractionService } from './interaction.service';
import { JournalService } from './journal.service';
import { Comment } from './entity/comment.entity';
import { JournalEntry } from './entity/journal-entry.entity';
import { Like } from './entity/like.entity';
import { WallMessage } from './entity/wall-message.entity';
import { User } from 'src/user/entity/user.entity';
import { JournalController } from './journal.controller';
import { InteractionController } from './interaction.controller';
import { WallController } from './wall.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, JournalEntry, Like, WallMessage, User]),
  ],
  controllers: [JournalController, InteractionController, WallController],
  providers: [WallService, InteractionService, JournalService],
})
export class CommunityModule {}
