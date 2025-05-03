import Redis from "ioredis";
import { RoomDetails } from "../rooms/rooms.types.js";
import { UserDetails } from "./types.js";
import { logger } from "../utils/logger.js";
import { nanoid } from "nanoid";

export class RedisNotInitialized extends Error {
  constructor() {
    super(`Redis client is not initialized`);
    this.name = "RedisNotInitialized";
  }
}
export class RedisOperationFailed extends Error {
  constructor(message: string) {
    super(`Redis client is not initialized, ${message}`);
    this.name = "RedisNotInitialized";
  }
}

export default class RedisService {
  private redisClient: Redis;
  public getKey = {
    rooms: () => `rooms`,
    members: (roomId: string) => `members:${roomId}`,
    messages: (roomId: string) => `messages:${roomId}`,
  };

  constructor(redisClient: Redis) {
    this.redisClient = redisClient;
  }

  getClient = () => {
    if (!this.redisClient) throw new RedisNotInitialized();

    return this.redisClient;
  };
}
