import dotenv from "dotenv";
import express from "express";
import redis, { Redis } from "ioredis";
import RedisService from "./redis/redisClient.js";
import { createRootRouter } from "./routes/index.js";
import { WebSocketClient } from "./websocket/websocketclient.js";
import cors from "cors";
import { RoomManager } from "./rooms/roomManager.js";
import { logger } from "./utils/logger.js";
import { MediaSoupService } from "./medisoup/mediasoupService.js";

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
  const wsClient = new WebSocketClient(httpServer);
  const redisService = new RedisService(new Redis());

  const roomManager = new RoomManager(redisService);

  await mediasoupService.createWorker();

  app.use(cors());
  app.use(express.json());
  app.use(
    "/api/v1/",
    createRootRouter(redisService, roomManager, mediasoupService, wsClient)
  );

  process.on("SIGTERM", () => {
    logger.info("SIGTERM received. Shutting down gracefully...");
    httpServer.close(() => {
      logger.info("Server closed");
      process.exit(0);
    });
  });
}

startServer();
