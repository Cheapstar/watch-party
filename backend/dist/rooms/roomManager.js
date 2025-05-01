import { Room } from "./room.js";
export class RoomManager {
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
            const room = new Room(router, roomId, redisService);
            this.rooms.set(roomId, room);
            this.routers.set(roomId, router);
            return room;
        };
        this.deleteRoom = (roomId) => {
            const room = this.getRoom(roomId);
            room?.closeRoom();
            this.rooms.delete(roomId);
        };
    }
}
