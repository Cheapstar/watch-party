import { Router } from "express";
import RedisService from "../redis/redisClient";
import { createRoomRouter } from "./room.route";
import { RoomManager } from "../rooms/roomManager";
import { MediaSoupService } from "../medisoup/mediasoupService";
import { WebSocketClient } from "../websocket/websocketclient";

export function createRootRouter(
  redisService: RedisService,
  roomManager: RoomManager,
  mediasoupService: MediaSoupService,
  wsClient: WebSocketClient
) {
  const router = Router();

  router.use(
    "/room",
    createRoomRouter(redisService, roomManager, mediasoupService, wsClient)
  );

  return router;
}
