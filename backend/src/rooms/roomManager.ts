import { Router } from "mediasoup/node/lib/types";
import { Room } from "./room";

export class RoomManager {
  public rooms: Map<string, Room> = new Map();
  public routers: Map<string, Router> = new Map();

  constructor() {}

  getRoom = (roomId: string) => {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId);
    }

    throw new Error(`Room with the roomId:${roomId} does not exists`);
  };

  createRoom = (roomId: string, router: Router) => {
    const room = new Room(router, roomId);

    this.rooms.set(roomId, room);
    this.routers.set(roomId, router);
    return room;
  };

  deleteRoom = (roomId: string) => {
    const room = this.getRoom(roomId);

    room?.closeRoom();

    this.rooms.delete(roomId);
  };
}
