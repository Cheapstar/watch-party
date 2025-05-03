import RedisService, { RedisOperationFailed } from "../redis/redisClient.js";
import { logger } from "../utils/logger.js";
import { MessageType } from "./types";

export class LiveChatNotInitialised extends Error {
  constructor(roomId: string) {
    super(`Live Chat for room with ID ${roomId} is not initialised`);
    this.name = "LiveChatNotInitialised";
  }
}

export class LiveChatService {
  private redisService: RedisService;
  private roomId: string;

  constructor(redisService: RedisService, roomId: string) {
    this.redisService = redisService;
    this.roomId = roomId;
  }

  saveMessage = async (message: MessageType) => {
    try {
      logger.info(`Saving the message in the redis room:${this.roomId}`);
      const redisClient = this.redisService.getClient();
      const response = await redisClient.rpush(
        this.redisService.getKey.messages(this.roomId),
        JSON.stringify(message)
      );

      if (!response)
        throw new RedisOperationFailed(
          `Could Not save the message into the redis, room:${this.roomId}`
        );

      logger.info(`Message has been Successfully Saved in the redis `);
    } catch (error) {
      logger.error(
        `Could Not save the message into the redis, room:${this.roomId}`
      );
      throw error;
    }
  };

  getAllMessages = async () => {
    try {
      logger.info(`Fetching Messages from the redis , room :${this.roomId}`);
      const redisClient = this.redisService.getClient();
      const response = await redisClient.lrange(
        this.redisService.getKey.messages(this.roomId),
        0,
        -1
      );

      if (!response)
        throw new RedisOperationFailed(
          `Could Not retrieve the messages from the redis, room:${this.roomId}`
        );

      logger.info(`Messages have been successfully retrieved`);

      const messages = response.map((msg) => JSON.parse(msg));

      return messages;
    } catch (error) {
      logger.error(`
        Could not retrieve the messages from the redis, room:${this.roomId}
        `);
      throw error;
    }
  };
}
