import { IsUUID, IsString, MaxLength } from 'class-validator';

export class SetFriendNoteDto {
  @IsUUID()
  friendID: string;

  @IsString()
  @MaxLength(255)
  note: string;
}
