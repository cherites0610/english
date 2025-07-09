import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateCoordinatesDto {
  @ApiProperty({
    description: '家具在小屋中的 X 座標',
    example: 5,
  })
  @IsInt()
  @Min(0) // 座標通常不為負數
  x: number;

  @ApiProperty({
    description: '家具在小屋中的 Y 座標',
    example: 8,
  })
  @IsInt()
  @Min(0)
  y: number;
}
