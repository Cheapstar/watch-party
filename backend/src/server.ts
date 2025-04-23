import dotenv from "dotenv";

import express from "express";
import redis, { Redis } from "ioredis";
import RedisService from "./redis/redisClient";
import { createRootRouter } from "./routes";
import { WebSocketClient } from "./websocket/websocketclient";
import cors from "cors";
import { RoomManager } from "./rooms/roomManager";
import { MediaSoupService } from "./medisoup/mediasoupService";

dotenv.config();

async function startServer() {
  const app = express();

  /*
  Redis Service bhi yaha pe hi chalu kardenge 
  and routes ko pass on karna hai jo bhi use karega 
  */
  const httpServer = app.listen(process.env.PORT, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT}`);
  });

  const mediasoupService = new MediaSoupService();
  const roomManager = new RoomManager();
  const wsClient = new WebSocketClient(httpServer);
  const redisService = new RedisService(new Redis());

  await mediasoupService.createWorker();

  app.use(cors());
  app.use(express.json());
  app.use(
    "/api/v1/",
    createRootRouter(redisService, roomManager, mediasoupService)
  );
}

startServer();
