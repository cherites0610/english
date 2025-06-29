import { PartialType } from '@nestjs/swagger';
import { CreateQuestTemplateDto } from './create-quest-template.dto';


/**
 * 用於更新任務模板的 DTO。
 * 使用 PartialType，它會繼承 CreateQuestTemplateDto 的所有屬性和驗證規則，
 * 並將它們全部標記為可選，這正是 PATCH 操作所需要的。
 */
export class UpdateQuestTemplateDto extends PartialType(CreateQuestTemplateDto) { }