import { PartialType } from '@nestjs/swagger';
import { CreateFurnitureTemplateDto } from './create-furniture-template.dto';

// 使用 PartialType，所有屬性都將變為可選，適合 PATCH 操作
export class UpdateFurnitureTemplateDto extends PartialType(CreateFurnitureTemplateDto) { }