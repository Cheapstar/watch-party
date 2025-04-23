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
export class RoomNotFoundError extends Error {
  constructor(roomId: string) {
    super(`Room with ID ${roomId} does not exist`);
    this.name = "RoomNotFoundError";
  }
}

export default class RedisService {
  private redisClient: Redis;
  private getKey = {
    rooms: (roomId: string) => `rooms:${roomId}`,
    members: (roomId: string) => `members:${roomId}`,
  };

  constructor(redisClient: Redis) {
    this.redisClient = redisClient;
  }

  createRoom = async (
    roomDetails: RoomDetails,
    userDetails: UserDetails
  ): Promise<string> => {
    const roomId = crypto.randomUUID();

    const multi = this.redisClient.multi();
    const rooms = multi.hset(
      this.getKey.rooms(roomId),
      roomId,
      JSON.stringify(roomDetails)
    );

    const member = multi.hset(
      this.getKey.members(roomId),
      userDetails.userId,
      JSON.stringify(userDetails)
    );

    await multi.exec();

    // if (!response) throw new Error("Couldn't save the details in the redis");

    return roomId;
  };

  addMemberToTheRoom = async (
    roomId: string,
    userDetails: UserDetails
  ): Promise<void> => {
    await this.ensureRoomExists(roomId);

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
    await this.ensureRoomExists(roomId);

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
    await this.ensureRoomExists(roomId);

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
    await this.ensureRoomExists(roomId);

    // Redis Transaction
    const multi = this.redisClient.multi();

    // delete the members hashset
    multi.del(this.getKey.members(roomId));
    // delete the room
    multi.del(this.getKey.rooms(roomId));

    await multi.exec();
  };

  getAllMember = async (roomId: string): Promise<UserDetails[]> => {
    await this.ensureRoomExists(roomId);

    const members = await this.redisClient.hvals(this.getKey.members(roomId));

    return members.map((m) => JSON.parse(m));
  };

  roomExists = async (roomId: string) => {
    return (await this.redisClient.exists(this.getKey.rooms(roomId))) === 1;
  };

  getRoomDetails = async (roomId: string) => {
    await this.ensureRoomExists(roomId);

    const response = await this.redisClient.hget(
      this.getKey.rooms(roomId),
      roomId
    );

    if (!response)
      throw new Error("Error Occured While fetching ROOM details from redis");

    return JSON.parse(response);
  };

  isUserHost = async (roomId: string, userId: string) => {
    await this.ensureRoomExists(roomId);

    const result = await this.redisClient.hget(
      this.getKey.members(roomId),
      userId
    );

    if (!result)
      throw new Error(
        `User Does not exists inside the room with roomId:${roomId}`
      );

    const userDetails: UserDetails = JSON.parse(result);

    return userDetails.isHost;
  };

  ensureRoomExists = async (roomId: string) => {
    const result = await this.roomExists(roomId);

    if (!result) throw new RoomNotFoundError(roomId);
  };
}
