"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomNotFoundError = void 0;
const logger_1 = require("../utils/logger");
class RoomNotFoundError extends Error {
    constructor(roomId) {
        super(`Room with ID ${roomId} does not exist`);
        this.name = "RoomNotFoundError";
    }
}
exports.RoomNotFoundError = RoomNotFoundError;
class RedisService {
    constructor(redisClient) {
        this.getKey = {
            rooms: (roomId) => `rooms:${roomId}`,
            members: (roomId) => `members:${roomId}`,
        };
        this.createRoom = (roomDetails, userDetails) => __awaiter(this, void 0, void 0, function* () {
            try {
                const roomId = crypto.randomUUID();
                const multi = this.redisClient.multi();
                multi.hset(this.getKey.rooms(roomId), roomId, JSON.stringify(roomDetails));
                multi.hset(this.getKey.members(roomId), userDetails.userId, JSON.stringify(userDetails));
                yield multi.exec();
                logger_1.logger.info(`Room created: ${roomId}, Host: ${userDetails.userId}`);
                return roomId;
            }
            catch (error) {
                logger_1.logger.error("Failed to create room", { error });
                throw error;
            }
        });
        this.addMemberToTheRoom = (roomId, userDetails) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.ensureRoomExists(roomId);
                const res = yield this.redisClient.hset(this.getKey.members(roomId), userDetails.userId, JSON.stringify(userDetails));
                logger_1.logger.info(`Member ${userDetails.userId} added to room ${roomId}`);
                if (!res)
                    throw new Error("Failed to add member to Redis");
            }
            catch (error) {
                logger_1.logger.error(`Failed to add member ${userDetails.userId} to room ${roomId}`, { error });
                throw error;
            }
        });
        this.getMemberDetails = (roomId, userId) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.ensureRoomExists(roomId);
                const res = yield this.redisClient.hget(this.getKey.members(roomId), userId);
                if (!res)
                    throw new Error(`Member ${userId} not found in room ${roomId}`);
                logger_1.logger.info(`Fetched member ${userId} from room ${roomId}`);
                return JSON.parse(res);
            }
            catch (error) {
                logger_1.logger.error(`Failed to get member ${userId} from room ${roomId}`, {
                    error,
                });
                throw error;
            }
        });
        this.isRoomEmpty = (roomId) => __awaiter(this, void 0, void 0, function* () {
            try {
                const len = yield this.redisClient.hlen(this.getKey.members(roomId));
                logger_1.logger.info(`Checked if room ${roomId} is empty: ${len === 0}`);
                return len === 0;
            }
            catch (error) {
                logger_1.logger.error(`Error checking if room ${roomId} is empty`, { error });
                throw error;
            }
        });
        this.deleteRoom = (roomId) => __awaiter(this, void 0, void 0, function* () {
            try {
                const multi = this.redisClient.multi();
                multi.del(this.getKey.members(roomId));
                multi.del(this.getKey.rooms(roomId));
                yield multi.exec();
                logger_1.logger.info(`Room ${roomId} and its members were deleted`);
            }
            catch (error) {
                logger_1.logger.error(`Error deleting room ${roomId}`, { error });
                throw error;
            }
        });
        this.getAllMember = (roomId) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.ensureRoomExists(roomId);
                const members = yield this.redisClient.hvals(this.getKey.members(roomId));
                logger_1.logger.info(`Fetched all members of room ${roomId}`);
                return members.map((m) => JSON.parse(m));
            }
            catch (error) {
                logger_1.logger.error(`Error fetching members of room ${roomId}`, { error });
                throw error;
            }
        });
        this.roomExists = (roomId) => __awaiter(this, void 0, void 0, function* () {
            const exists = (yield this.redisClient.exists(this.getKey.rooms(roomId))) === 1;
            logger_1.logger.debug(`Room ${roomId} exists: ${exists}`);
            return exists;
        });
        this.getRoomDetails = (roomId) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.ensureRoomExists(roomId);
                const res = yield this.redisClient.hget(this.getKey.rooms(roomId), roomId);
                if (!res)
                    throw new Error(`Room details for ${roomId} not found`);
                logger_1.logger.info(`Fetched room details for ${roomId}`);
                return JSON.parse(res);
            }
            catch (error) {
                logger_1.logger.error(`Error fetching room details for ${roomId}`, { error });
                throw error;
            }
        });
        this.userExists = (roomId, userId) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.ensureRoomExists(roomId);
                logger_1.logger.info(`Checking Does User with userId:${userId} Exists or not in the room ${roomId}`);
                const userExists = yield this.redisClient.hexists(this.getKey.members(roomId), userId);
                logger_1.logger.info(`UserExists result : ${userExists}`);
                return Boolean(userExists);
            }
            catch (error) {
                logger_1.logger.error(`Error checking user exists for user ${userId} in room ${roomId}: ${error instanceof Error ? error.stack : error}`);
                throw error;
            }
        });
        this.isUserHost = (roomId, userId) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.ensureRoomExists(roomId);
                const exists = yield this.userExists(roomId, userId);
                logger_1.logger.info(`User Exists or not ${exists}`);
                if (!exists)
                    return false;
                const res = yield this.redisClient.hget(this.getKey.members(roomId), userId);
                console.log("User Details", res);
                if (!res)
                    throw new Error(`User ${userId} not found in room ${roomId}`);
                const userDetails = JSON.parse(res);
                logger_1.logger.info(`Checked host status for user ${userId} in room ${roomId}: ${userDetails.isHost}`);
                return userDetails.isHost;
            }
            catch (error) {
                logger_1.logger.error(`Error checking host status for user ${userId} in room ${roomId}: ${error instanceof Error ? error.stack : error}`);
                throw error;
            }
        });
        this.removeUserFromRoom = (roomId, userId) => __awaiter(this, void 0, void 0, function* () {
            try {
                this.ensureRoomExists(roomId);
                const exists = this.userExists(roomId, userId);
                if (!exists) {
                    logger_1.logger.error(`User ${userId} Does not exists in room ${roomId}`);
                    throw new Error(`User ${userId} Does not exists in room ${roomId}`);
                }
                yield this.redisClient.hdel(this.getKey.members(roomId), userId);
            }
            catch (error) {
                logger_1.logger.error(`Error Deleting the user ${userId} from room ${roomId}: ${error instanceof Error ? error.stack : error}`);
                throw error;
            }
        });
        this.ensureRoomExists = (roomId) => __awaiter(this, void 0, void 0, function* () {
            const exists = yield this.roomExists(roomId);
            if (!exists) {
                logger_1.logger.warn(`Room ${roomId} not found`);
                throw new RoomNotFoundError(roomId);
            }
        });
        this.redisClient = redisClient;
    }
}
exports.default = RedisService;
