import Redis from "ioredis";
import { RoomDetails } from "../rooms/rooms.types.js";
import { UserDetails } from "./types.js";
import { logger } from "../utils/logger.js";
import { nanoid } from "nanoid";

export class RoomNotFoundError extends Error {
  constructor(roomId: string) {
    super(`Room with ID ${roomId} does not exist`);
    this.name = "RoomNotFoundError";
  }
}

export default class RedisService {
  private redisClient: Redis;
  private getKey = {
    rooms: () => `rooms`,
    members: (roomId: string) => `members:${roomId}`,
  };

  constructor(redisClient: Redis) {
    this.redisClient = redisClient;
  }

  createRoom = async (
    roomDetails: RoomDetails,
    userDetails: UserDetails
  ): Promise<string> => {
    try {
      const roomId = nanoid();

      const multi = this.redisClient.multi();
      multi.hset(this.getKey.rooms(), roomId, JSON.stringify(roomDetails));
      multi.hset(
        this.getKey.members(roomId),
        userDetails.userId,
        JSON.stringify(userDetails)
      );

      await multi.exec();

      logger.info(`Room created: ${roomId}, Host: ${userDetails.userId}`);
      return roomId;
    } catch (error) {
      logger.error("Failed to create room", { error });
      throw error;
    }
  };

  addMemberToTheRoom = async (
    roomId: string,
    userDetails: UserDetails
  ): Promise<void> => {
    try {
      await this.ensureRoomExists(roomId);
      const res = await this.redisClient.hset(
        this.getKey.members(roomId),
        userDetails.userId,
        JSON.stringify(userDetails)
      );
      logger.info(`Member ${userDetails.userId} added to room ${roomId}`);
      if (!res) throw new Error("Failed to add member to Redis");
    } catch (error) {
      logger.error(
        `Failed to add member ${userDetails.userId} to room ${roomId}`,
        { error }
      );
      throw error;
    }
  };

  getMemberDetails = async (
    roomId: string,
    userId: string
  ): Promise<UserDetails> => {
    try {
      await this.ensureRoomExists(roomId);
      const res = await this.redisClient.hget(
        this.getKey.members(roomId),
        userId
      );
      if (!res) throw new Error(`Member ${userId} not found in room ${roomId}`);
      logger.info(`Fetched member ${userId} from room ${roomId}`);
      return JSON.parse(res);
    } catch (error) {
      logger.error(`Failed to get member ${userId} from room ${roomId}`, {
        error,
      });
      throw error;
    }
  };

  isRoomEmpty = async (roomId: string): Promise<boolean> => {
    try {
      const len = await this.redisClient.hlen(this.getKey.members(roomId));
      logger.info(`Checked if room ${roomId} is empty: ${len === 0}`);
      return len === 0;
    } catch (error) {
      logger.error(`Error checking if room ${roomId} is empty`, { error });
      throw error;
    }
  };

  deleteRoom = async (roomId: string): Promise<void> => {
    try {
      const multi = this.redisClient.multi();
      multi.del(this.getKey.members(roomId));
      multi.hdel(this.getKey.rooms(), roomId);
      await multi.exec();
      logger.info(`Room ${roomId} and its members were deleted`);
    } catch (error) {
      logger.error(`Error deleting room ${roomId}`, { error });
      throw error;
    }
  };

  saveRoom = async (roomId: string, roomDetails: RoomDetails) => {
    try {
      logger.info(`Saving the room with roomId:${roomId}`);
      await this.ensureRoomExists(roomId);
      const response = this.redisClient.hset(
        this.getKey.rooms(),
        roomId,
        JSON.stringify(roomDetails)
      );

      if (!response) {
        throw new Error("Could not save the roomDetails");
      }

      logger.info(`Room Details for the room :${roomId} successfully saved`);
    } catch (error) {
      logger.error(`Error Occured While Saving the Room in the redis`);
      throw error;
    }
  };

  getAllMember = async (roomId: string): Promise<UserDetails[]> => {
    try {
      await this.ensureRoomExists(roomId);
      const members = await this.redisClient.hvals(this.getKey.members(roomId));
      logger.info(`Fetched all members of room ${roomId}`);
      return members.map((m) => JSON.parse(m));
    } catch (error) {
      logger.error(`Error fetching members of room ${roomId}`, { error });
      throw error;
    }
  };

  roomExists = async (roomId: string) => {
    const exists = (await this.redisClient.exists(this.getKey.rooms())) === 1;
    logger.debug(`Room ${roomId} exists: ${exists}`);
    return exists;
  };

  getRoomDetails = async (roomId: string) => {
    try {
      await this.ensureRoomExists(roomId);
      const res = await this.redisClient.hget(this.getKey.rooms(), roomId);
      if (!res) throw new Error(`Room details for ${roomId} not found`);
      logger.info(`Fetched room details for ${roomId}`);
      return JSON.parse(res);
    } catch (error) {
      logger.error(`Error fetching room details for ${roomId}`, { error });
      throw error;
    }
  };

  userExists = async (roomId: string, userId: string) => {
    try {
      await this.ensureRoomExists(roomId);
      logger.info(
        `Checking Does User with userId:${userId} Exists or not in the room ${roomId}`
      );
      const userExists = await this.redisClient.hexists(
        this.getKey.members(roomId),
        userId
      );

      logger.info(`UserExists result : ${userExists}`);
      return Boolean(userExists);
    } catch (error) {
      logger.error(
        `Error checking user exists for user ${userId} in room ${roomId}: ${
          error instanceof Error ? error.stack : error
        }`
      );
      throw error;
    }
  };

  isUserHost = async (roomId: string, userId: string) => {
    try {
      await this.ensureRoomExists(roomId);

      const exists = await this.userExists(roomId, userId);
      logger.info(`User Exists or not ${exists}`);
      if (!exists) return false;

      const res = await this.redisClient.hget(
        this.getKey.members(roomId),
        userId
      );
      console.log("User Details", res);
      if (!res) throw new Error(`User ${userId} not found in room ${roomId}`);
      const userDetails: UserDetails = JSON.parse(res);
      logger.info(
        `Checked host status for user ${userId} in room ${roomId}: ${userDetails.isHost}`
      );
      return userDetails.isHost;
    } catch (error) {
      logger.error(
        `Error checking host status for user ${userId} in room ${roomId}: ${
          error instanceof Error ? error.stack : error
        }`
      );
      throw error;
    }
  };

  removeUserFromRoom = async (roomId: string, userId: string) => {
    try {
      this.ensureRoomExists(roomId);
      const exists = this.userExists(roomId, userId);

      if (!exists) {
        logger.error(`User ${userId} Does not exists in room ${roomId}`);
        throw new Error(`User ${userId} Does not exists in room ${roomId}`);
      }

      await this.redisClient.hdel(this.getKey.members(roomId), userId);
    } catch (error) {
      logger.error(
        `Error Deleting the user ${userId} from room ${roomId}: ${
          error instanceof Error ? error.stack : error
        }`
      );
      throw error;
    }
  };

  ensureRoomExists = async (roomId: string) => {
    const exists = await this.roomExists(roomId);
    if (!exists) {
      logger.warn(`Room ${roomId} not found`);
      throw new RoomNotFoundError(roomId);
    }
  };
}
