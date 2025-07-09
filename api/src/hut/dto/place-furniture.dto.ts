import { IsUUID, IsInt } from 'class-validator';
export class PlaceFurnitureDto {
  @IsUUID()
  templateId: string;
  @IsInt()
  x: number;
  @IsInt()
  y: number;
}
