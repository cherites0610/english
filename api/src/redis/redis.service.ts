import { Injectable, OnModuleDestroy, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  public redis: Redis;
  private readonly logger = new Logger("RedisService");

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>("REDIS_URL");
    if (!url) {
      throw new Error("REDIS_URL is not defined");
    }
    this.redis = new Redis(url);

    this.redis.on("connect", () => {
      this.logger.log("Redis connected");
    });
  }

  // 封裝常用的 Redis 操作
  async set(
    key: string,
    value: string | number,
    expiry?: number,
  ): Promise<void> {
    try {
      if ( expiry) {
        await this.redis.set(key, value, 'EX', expiry);
      } else {
        await this.redis.set(key, value);
      }
      // this.logger.debug(`Set key ${key} successfully`);
    } catch (err:any) {
      this.logger.error(`Failed to set key ${key}`);
      throw err;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const value = await this.redis.get(key);
      // this.logger.debug(`Get key ${key}: ${value}`);
      return value;
    } catch (err:any) {
      this.logger.error(`Failed to get key ${key}`);
      throw err;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.logger.debug(`Deleted key ${key} successfully`);
    } catch (err:any) {
      this.logger.error(`Failed to delete key ${key}`);
      throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      // this.logger.debug(`Checked existence of key ${key}: ${result}`);
      return result === 1;
    } catch (err:any) {
      this.logger.error(`Failed to check existence of key ${key}`);
      throw err;
    }
  }

  // 模組銷毀時關閉 Redis 連線
  async onModuleDestroy() {
    try {
      await this.redis.quit();
      this.logger.log('Redis connection closed');
    } catch (err:any) {
      this.logger.error(`Failed to close Redis connection`);
    }
  }
}




