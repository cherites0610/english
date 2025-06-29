import { Controller, Get, Post, Param, Body, Patch } from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { UserID } from "src/common/decorators/user.decorator";
import { HutService } from "./hut.service";
import { FurnitureListResponse, FurnitureResponse } from "./dto/hut.response.dto";
import { UpdateCoordinatesDto } from "./dto/update-coordinates.dto";

@ApiTags('Hut & Inventory')
@Controller('hut')
export class HutController {
  constructor(private readonly hutService: HutService) { }

  /**
   * 獲取小屋中所有「已放置」的家具
   */
  @Get('placed-furniture')
  @ApiOkResponse({ description: '成功獲取已放置的家具列表', type: FurnitureListResponse })
  async getPlacedFurniture(@UserID() userId: string): Promise<FurnitureListResponse> {
    const furniture = await this.hutService.getPlacedFurniture(userId);
    return { message: '獲取已放置的家具成功', data: furniture };
  }

  /**
   * 獲取玩家家具庫中所有「未放置」的家具
   */
  @Get('inventory-furniture')
  @ApiOkResponse({ description: '成功獲取庫存中的家具列表', type: FurnitureListResponse })
  async getInventoryFurniture(@UserID() userId: string): Promise<FurnitureListResponse> {
    const furniture = await this.hutService.getInventoryFurniture(userId);
    return { message: '獲取庫存家具成功', data: furniture };
  }

  @Post('furniture/:id/unplace')
  async unplaceFurniture(@UserID() userId: string, @Param('id') furnitureId: string) {
    const furniture = await this.hutService.unplaceFurniture(userId, furnitureId);
    return { message: '已收回到庫存', data: furniture };
  }

  /**
   * 將庫存中的家具放置到小屋
   */
  @Post('furniture/:id/place')
  @ApiOkResponse({ description: '成功放置家具', type: FurnitureResponse }) // 假設您有對應的響應 DTO
  @ApiBody({ type: UpdateCoordinatesDto }) // <--- 明確指定 Body 的類型
  async placeFurniture(
    @UserID() userId: string,
    @Param('id') furnitureId: string,
    @Body() dto: UpdateCoordinatesDto, // <--- 使用新的 DTO
  ) {
    const furniture = await this.hutService.placeFurniture(userId, furnitureId, dto);
    return { message: '放置成功', data: furniture };
  }

  /**
   * 移動小屋中已放置的家具
   */
  @Patch('furniture/:id/move')
  @ApiOkResponse({ description: '成功移動家具', type: FurnitureResponse })
  @ApiBody({ type: UpdateCoordinatesDto }) // <--- 共用同一個 DTO
  async moveFurniture(
    @UserID() userId: string,
    @Param('id') furnitureId: string,
    @Body() dto: UpdateCoordinatesDto, // <--- 使用新的 DTO
  ) {
    const furniture = await this.hutService.moveFurniture(userId, furnitureId, dto);
    return { message: '移動成功', data: furniture };
  }
}