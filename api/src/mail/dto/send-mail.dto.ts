import { IsString, IsUUID } from "class-validator";

export class SendMailDto {
    @IsString()
    title: string

    @IsString()
    context: string

    @IsString()
    from: string

    @IsUUID()
    targetUserId: string
}