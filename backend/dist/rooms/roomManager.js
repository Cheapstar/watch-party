import { Room } from "./room.js";
import { logger } from "../utils/logger.js";
export class RoomNotFoundError extends Error {
    constructor(roomId) {
        super(`Room with ID ${roomId} does not exist`);
        this.name = "RoomNotFoundError";
    }
}
export class RoomManager {
    constructor(redisService) {
        this.rooms = new Map();
        this.routers = new Map();
        this.getRoom = (roomId) => {
            if (this.rooms.has(roomId)) {
                return this.rooms.get(roomId);
            }
            throw new Error(`Room with the roomId:${roomId} does not exists`);
        };
        this.createRoom = async (roomId, roomDetails, userDetails, router) => {
            try {
                const redisClient = this.redisService.getClient();
                const multi = redisClient.multi();
                multi.hset(this.redisService.getKey.rooms(), roomId, JSON.stringify(roomDetails));
                multi.hset(this.redisService.getKey.members(roomId), userDetails.userId, JSON.stringify(userDetails));
                await multi.exec();
                const room = new Room(router, roomId, this.redisService, this);
                this.rooms.set(roomId, room);
                this.routers.set(roomId, router);
                logger.info(`Room created: ${roomId}, Host: ${userDetails.userId}`);
                return roomId;
            }
            catch (error) {
                logger.error("Failed to create room", { error });
                throw error;
            }
        };
        this.deleteRoom = async (roomId) => {
            try {
                const redisClient = this.redisService.getClient();
                const multi = redisClient.multi();
                multi.del(this.redisService.getKey.members(roomId));
                multi.hdel(this.redisService.getKey.rooms(), roomId);
                await multi.exec();
                const room = this.getRoom(roomId);
                room?.closeRoom();
                this.rooms.delete(roomId);
                logger.info(`Room ${roomId} and its members were deleted`);
            }
            catch (error) {
                logger.error(`Error deleting room ${roomId}`, { error });
                throw error;
            }
        };
        this.saveRoom = async (roomId, roomDetails) => {
            try {
                logger.info(`Saving the room with roomId:${roomId}`);
                await this.ensureRoomExists(roomId);
                const redisClient = this.redisService.getClient();
                const response = redisClient.hset(this.redisService.getKey.rooms(), roomId, JSON.stringify(roomDetails));
                if (!response) {
                    throw new Error("Could not save the roomDetails");
                }
                logger.info(`Room Details for the room :${roomId} successfully saved`);
            }
            catch (error) {
                logger.error(`Error Occured While Saving the Room in the redis`);
                throw error;
            }
        };
        this.roomExists = async (roomId) => {
            const redisClient = this.redisService.getClient();
            const exists = (await redisClient.exists(this.redisService.getKey.rooms())) === 1;
            logger.debug(`Room ${roomId} exists: ${exists}`);
            return exists;
        };
        this.ensureRoomExists = async (roomId) => {
            const exists = await this.roomExists(roomId);
            if (!exists) {
                logger.warn(`Room ${roomId} not found`);
                throw new RoomNotFoundError(roomId);
            }
        };
        this.redisService = redisService;
    }
}
