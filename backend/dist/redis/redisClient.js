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
/*
    There will be two hashSets

    one for rooms ,
        which will contains all the roomId to roomsDetails mapping
    second for member
        which will contain memberId to userDetails mapping

*/
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
            const roomId = crypto.randomUUID();
            const multi = this.redisClient.multi();
            const rooms = multi.hset(this.getKey.rooms(roomId), roomId, JSON.stringify(roomDetails));
            const member = multi.hset(this.getKey.members(roomId), userDetails.userId, JSON.stringify(userDetails));
            yield multi.exec();
            // if (!response) throw new Error("Couldn't save the details in the redis");
            return roomId;
        });
        this.addMemberToTheRoom = (roomId, userDetails) => __awaiter(this, void 0, void 0, function* () {
            yield this.ensureRoomExists(roomId);
            const response = yield this.redisClient.hset(this.getKey.members(roomId), userDetails.userId, JSON.stringify(userDetails));
            if (!response)
                throw new Error("Couldn't save the details in the redis");
        });
        this.getMemberDetails = (roomId, userId) => __awaiter(this, void 0, void 0, function* () {
            yield this.ensureRoomExists(roomId);
            const response = yield this.redisClient.hget(this.getKey.members(roomId), userId);
            if (!response)
                throw new Error("Invalid Key");
            return JSON.parse(response);
        });
        this.removeUserFromRoom = (roomId, userId) => __awaiter(this, void 0, void 0, function* () {
            yield this.ensureRoomExists(roomId);
            const response = yield this.redisClient.hdel(this.getKey.members(roomId), userId);
            if (!response)
                throw new Error("Could not execute the removal of user from room");
        });
        this.isRoomEmpty = (roomId) => __awaiter(this, void 0, void 0, function* () {
            const len = yield this.redisClient.hlen(this.getKey.members(roomId));
            return len === 0;
        });
        this.deleteRoom = (roomId) => __awaiter(this, void 0, void 0, function* () {
            yield this.ensureRoomExists(roomId);
            // Redis Transaction
            const multi = this.redisClient.multi();
            // delete the members hashset
            multi.del(this.getKey.members(roomId));
            // delete the room
            multi.del(this.getKey.rooms(roomId));
            yield multi.exec();
        });
        this.getAllMember = (roomId) => __awaiter(this, void 0, void 0, function* () {
            yield this.ensureRoomExists(roomId);
            const members = yield this.redisClient.hvals(this.getKey.members(roomId));
            return members.map((m) => JSON.parse(m));
        });
        this.roomExists = (roomId) => __awaiter(this, void 0, void 0, function* () {
            return (yield this.redisClient.exists(this.getKey.rooms(roomId))) === 1;
        });
        this.getRoomDetails = (roomId) => __awaiter(this, void 0, void 0, function* () {
            yield this.ensureRoomExists(roomId);
            const response = yield this.redisClient.hget(this.getKey.rooms(roomId), roomId);
            if (!response)
                throw new Error("Error Occured While fetching ROOM details from redis");
            return JSON.parse(response);
        });
        this.isUserHost = (roomId, userId) => __awaiter(this, void 0, void 0, function* () {
            yield this.ensureRoomExists(roomId);
            const result = yield this.redisClient.hget(this.getKey.members(roomId), userId);
            if (!result)
                throw new Error(`User Does not exists inside the room with roomId:${roomId}`);
            const userDetails = JSON.parse(result);
            return userDetails.isHost;
        });
        this.ensureRoomExists = (roomId) => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.roomExists(roomId);
            if (!result)
                throw new RoomNotFoundError(roomId);
        });
        this.redisClient = redisClient;
    }
}
exports.default = RedisService;
