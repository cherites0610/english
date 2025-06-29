import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/entity/user.entity";
import { Repository } from "typeorm";
import { FurnitureTemplate } from "./entity/furniture-template.entity";
import { Furniture } from "./entity/furniture.entity";

// 假設這是一個新的、更通用的 FurnitureService
@Injectable()
export class FurnitureService {
    constructor(
        @InjectRepository(Furniture) private readonly furnitureRepository: Repository<Furniture>,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        @InjectRepository(FurnitureTemplate) private readonly templateRepository: Repository<FurnitureTemplate>,
    ) { }

    /**
     * 授予玩家一個新的家具（放入其庫存）
     * @param userId 玩家 ID
     * @param templateId 家具模板 ID
     */
    async grantToUser(userId: string, templateId: string): Promise<Furniture> {
        const owner = await this.userRepository.findOneByOrFail({ id: userId });
        const template = await this.templateRepository.findOneByOrFail({ id: templateId });

        const newFurniture = this.furnitureRepository.create({
            owner,
            template,
            // hut, x, y 保持為 null，代表在庫存中
        });

        return this.furnitureRepository.save(newFurniture);
    }
}