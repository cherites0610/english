import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FurnitureTemplate } from './entity/furniture-template.entity';
import { CreateFurnitureTemplateDto } from './dto/create-furniture-template.dto';
import { UpdateFurnitureTemplateDto } from './dto/update-furniture-template.dto';
import { FurnitureTemplateDto } from './dto/furniture-template.dto';

@Injectable()
export class FurnitureAdminService {
    constructor(
        @InjectRepository(FurnitureTemplate)
        private readonly templateRepository: Repository<FurnitureTemplate>,
    ) { }

    async create(createDto: CreateFurnitureTemplateDto): Promise<FurnitureTemplateDto> {
        const newTemplate = this.templateRepository.create(createDto);
        const savedTemplate = await this.templateRepository.save(newTemplate);
        return this.mapToDto(savedTemplate);
    }

    async findAll(): Promise<FurnitureTemplateDto[]> {
        const templates = await this.templateRepository.find({ order: { name: 'ASC' } });
        return templates.map(this.mapToDto);
    }

    async findOne(id: string): Promise<FurnitureTemplateDto> {
        const template = await this.templateRepository.findOneBy({ id });
        if (!template) {
            throw new NotFoundException(`找不到 ID 為 ${id} 的家具模板`);
        }
        return this.mapToDto(template);
    }

    async update(id: string, updateDto: UpdateFurnitureTemplateDto): Promise<FurnitureTemplateDto> {
        const template = await this.templateRepository.preload({
            id: id,
            ...updateDto,
        });
        if (!template) {
            throw new NotFoundException(`找不到 ID 為 ${id} 的家具模板`);
        }
        const updatedTemplate = await this.templateRepository.save(template);
        return this.mapToDto(updatedTemplate);
    }

    async remove(id: string): Promise<void> {
        const result = await this.templateRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`找不到 ID 為 ${id} 的家具模板`);
        }
    }

    // 私有輔助方法，將實體映射到 DTO
    private mapToDto(template: FurnitureTemplate): FurnitureTemplateDto {
        return {
            id: template.id,
            name: template.name,
            description: template.description,
            imageUrl: template.imageUrl,
            width: template.width,
            height: template.height,
        };
    }
}