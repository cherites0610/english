import { IsInt } from 'class-validator';
export class MoveFurnitureDto {
    @IsInt()
    x: number;
    @IsInt()
    y: number;
}