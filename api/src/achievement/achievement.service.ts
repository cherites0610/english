import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';
import { Achievement } from './entity/achievement.entity';

@Injectable()
export class AchievementService {
  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepository: Repository<Achievement>,
  ) {}

  async create(dto: CreateAchievementDto): Promise<Achievement> {
    const achievement = this.achievementRepository.create(dto);
    return this.achievementRepository.save(achievement);
  }

  async findAll(): Promise<Achievement[]> {
    return this.achievementRepository.find();
  }

  async findOne(id: string): Promise<Achievement> {
    const achievement = await this.achievementRepository.findOne({
      where: { id },
    });
    if (!achievement) {
      throw new NotFoundException(`Achievement with ID ${id} not found`);
    }
    return achievement;
  }

  async update(id: string, dto: UpdateAchievementDto): Promise<Achievement> {
    const achievement = await this.findOne(id);
    const updated = Object.assign(achievement, dto);
    return this.achievementRepository.save(updated);
  }

  async remove(id: string): Promise<void> {
    const achievement = await this.findOne(id);
    await this.achievementRepository.remove(achievement);
  }
}
