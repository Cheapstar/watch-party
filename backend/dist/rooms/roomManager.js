"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
const room_1 = require("./room");
class RoomManager {
    constructor() {
        this.rooms = new Map();
        this.routers = new Map();
        this.getRoom = (roomId) => {
            if (this.rooms.has(roomId)) {
                return this.rooms.get(roomId);
            }
            throw new Error(`Room with the roomId:${roomId} does not exists`);
        };
        this.createRoom = (roomId, router, redisService) => {
            const room = new room_1.Room(router, roomId, redisService);
            this.rooms.set(roomId, room);
            this.routers.set(roomId, router);
            return room;
        };
        this.deleteRoom = (roomId) => {
            const room = this.getRoom(roomId);
            room === null || room === void 0 ? void 0 : room.closeRoom();
            this.rooms.delete(roomId);
        };
    }
}
exports.RoomManager = RoomManager;
