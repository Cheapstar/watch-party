import { Router } from "express";
import { createRoomRouter } from "./room.route.js";
export function createRootRouter(redisService, roomManager, mediasoupService, wsClient) {
    const router = Router();
    router.use("/room", createRoomRouter(redisService, roomManager, mediasoupService, wsClient));
    return router;
}
