import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Furniture } from 'src/furniture/entity/furniture.entity';
import { Repository, Not, IsNull } from 'typeorm';
import { Hut } from './entity/hut.entity';
import { FurnitureDto } from './dto/hut.response.dto';

@Injectable()
export class HutService {
  constructor(
    @InjectRepository(Hut) private readonly hutRepository: Repository<Hut>,
    @InjectRepository(Furniture)
    private readonly furnitureRepository: Repository<Furniture>,
  ) {}

  /**
   * 獲取小屋中「已放置」的家具，並轉換為 DTO 格式
   */
  async getPlacedFurniture(userId: string): Promise<FurnitureDto[]> {
    const placedFurniture = await this.furnitureRepository.find({
      where: { owner: { id: userId }, hut: Not(IsNull()) },
      relations: ['template'],
    });
    return placedFurniture.map(this.mapFurnitureToDto);
  }

  /**
   * 獲取玩家庫存中「未放置」的家具，並轉換為 DTO 格式
   */
  async getInventoryFurniture(userId: string): Promise<FurnitureDto[]> {
    const inventoryFurniture = await this.furnitureRepository.find({
      where: { owner: { id: userId }, hut: IsNull() },
      relations: ['template'],
    });
    return inventoryFurniture.map(this.mapFurnitureToDto);
  }

  // 私有輔助方法：將 Furniture 實體映射到 FurnitureDto
  private mapFurnitureToDto(furniture: Furniture): FurnitureDto {
    return {
      id: furniture.id,
      x: furniture.x ?? undefined,
      y: furniture.y ?? undefined,
      rotation: furniture.rotation,
      template: {
        id: furniture.template.id,
        name: furniture.template.name,
        imageUrl: furniture.template.imageUrl,
        width: furniture.template.width,
        height: furniture.template.height,
      },
    };
  }

  // 將庫存中的家具放置到小屋裡
  async placeFurniture(
    userId: string,
    furnitureId: string,
    dto: { x: number; y: number },
  ): Promise<Furniture> {
    const furniture = await this.furnitureRepository.findOneByOrFail({
      id: furnitureId,
      owner: { id: userId },
    });
    if (furniture.hut) {
      throw new ConflictException('此家具已被放置');
    }

    const hut = await this.hutRepository.findOneByOrFail({
      user: { id: userId },
    });
    furniture.hut = hut;
    furniture.x = dto.x;
    furniture.y = dto.y;
    return this.furnitureRepository.save(furniture);
  }

  // 將小屋中的家具收回到庫存
  async unplaceFurniture(
    userId: string,
    furnitureId: string,
  ): Promise<Furniture> {
    const furniture = await this.furnitureRepository.findOneByOrFail({
      id: furnitureId,
      owner: { id: userId },
    });
    if (!furniture.hut) {
      throw new ConflictException('此家具已在庫存中');
    }

    furniture.hut = null;
    furniture.x = null;
    furniture.y = null;
    return this.furnitureRepository.save(furniture);
  }

  // 移動家具（邏輯不變，但權限驗證更明確）
  async moveFurniture(
    userId: string,
    furnitureId: string,
    dto: { x: number; y: number },
  ): Promise<Furniture> {
    const furniture = await this.furnitureRepository.findOneByOrFail({
      id: furnitureId,
      owner: { id: userId },
      hut: Not(IsNull()),
    });
    furniture.x = dto.x;
    furniture.y = dto.y;
    return this.furnitureRepository.save(furniture);
  }
}
