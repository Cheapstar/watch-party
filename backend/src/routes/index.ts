import { Router } from "express";
import RedisService from "../redis/redisClient.js";
import { createRoomRouter } from "./room.route.js";
import { RoomManager } from "../rooms/roomManager.js";
import { MediaSoupService } from "../medisoup/mediasoupService.js";
import { WebSocketClient } from "../websocket/websocketclient.js";

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
