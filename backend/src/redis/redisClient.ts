import Redis from "ioredis";
import { RoomDetails } from "../rooms/rooms.types";
import { UserDetails } from "./types";

/*
    There will be two hashSets 

    one for rooms , 
        which will contains all the roomId to roomsDetails mapping
    second for member
        which will contain memberId to userDetails mapping

*/

export default class RedisService {
  private redisClient: Redis;
  private getKey = {
    rooms: (roomId: string) => `rooms:${roomId}`,
    members: (roomId: string) => `members:${roomId}`,
  };

  constructor(redisClient: Redis) {
    this.redisClient = redisClient;
  }

  createRoom = async (roomDetails: RoomDetails): Promise<string> => {
    const roomId = crypto.randomUUID();
    const response = await this.redisClient.hset(
      this.getKey.rooms(roomId),
      roomId,
      JSON.stringify(roomDetails)
    );

    if (!response) throw new Error("Couldn't save the details in the redis");

    return roomId;
  };

  addMemberToTheRoom = async (
    roomId: string,
    userDetails: UserDetails
  ): Promise<void> => {
    const response = await this.redisClient.hset(
      this.getKey.members(roomId),
      userDetails.userId,
      JSON.stringify(userDetails)
    );
    if (!response) throw new Error("Couldn't save the details in the redis");
  };

  getMemberDetails = async (
    roomId: string,
    userId: string
  ): Promise<UserDetails> => {
    const response = await this.redisClient.hget(
      this.getKey.members(roomId),
      userId
    );

    if (!response) throw new Error("Invalid Key");

    return JSON.parse(response);
  };

  removeUserFromRoom = async (
    roomId: string,
    userId: string
  ): Promise<void> => {
    const response = await this.redisClient.hdel(
      this.getKey.members(roomId),
      userId
    );

    if (!response)
      throw new Error("Could not execute the removal of user from room");
  };

  isRoomEmpty = async (roomId: string): Promise<boolean> => {
    const len = await this.redisClient.hlen(this.getKey.members(roomId));
    return len === 0;
  };

  deleteRoom = async (roomId: string): Promise<void> => {
    // Redis Transaction
    const multi = this.redisClient.multi();

    // delete the members hashset
    multi.del(this.getKey.members(roomId));
    // delete the room
    multi.del(this.getKey.rooms(roomId));

    await multi.exec();
  };

  getAllMember = async (roomId: string): Promise<UserDetails[]> => {
    const members = await this.redisClient.hvals(this.getKey.members(roomId));

    return members.map((m) => JSON.parse(m));
  };
}
