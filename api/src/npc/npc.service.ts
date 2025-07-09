import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Npc } from './entity/npc.entity';
import { CreateNpcDto, UpdateNpcDto, NpcDto } from './dto/npc.dto';

@Injectable()
export class NpcService {
  constructor(
    @InjectRepository(Npc)
    private readonly npcRepository: Repository<Npc>,
  ) {}

  /**
   * 創建一個新的 NPC
   */
  async create(createDto: CreateNpcDto): Promise<NpcDto> {
    const npc = this.npcRepository.create(createDto);
    const savedNpc = await this.npcRepository.save(npc);
    return this.mapToDto(savedNpc);
  }

  /**
   * 查詢所有 NPC
   */
  async findAll(): Promise<NpcDto[]> {
    const npcs = await this.npcRepository.find({
      order: { name: 'ASC' },
    });
    return npcs.map((npc) => this.mapToDto(npc));
  }

  /**
   * 根據 ID 查詢單個 NPC
   */
  async findOne(id: string): Promise<NpcDto> {
    const npc = await this.npcRepository.findOneBy({ id });
    if (!npc) {
      throw new NotFoundException(`找不到 ID 為 ${id} 的 NPC`);
    }
    return this.mapToDto(npc);
  }

  /**
   * 根據 ID 更新一個 NPC
   */
  async update(id: string, updateDto: UpdateNpcDto): Promise<NpcDto> {
    // preload 會根據 id 查找實體，並將 updateDto 的內容合併到該實體上
    const npc = await this.npcRepository.preload({
      id: id,
      ...updateDto,
    });
    if (!npc) {
      throw new NotFoundException(`找不到 ID 為 ${id} 的 NPC`);
    }
    const updatedNpc = await this.npcRepository.save(npc);
    return this.mapToDto(updatedNpc);
  }

  /**
   * 根據 ID 刪除一個 NPC
   */
  async remove(id: string): Promise<void> {
    const result = await this.npcRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`找不到 ID 為 ${id} 的 NPC`);
    }
  }

  /**
   * 私有輔助方法：將 Npc 實體映射到 NpcDto
   */
  private mapToDto(npc: Npc): NpcDto {
    return {
      id: npc.id,
      name: npc.name,
      avatar: npc.avatar,
      voiceId: npc.voiceId,
      profession: npc.profession,
      backstory: npc.backstory,
    };
  }
}
