"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRootRouter = createRootRouter;
const express_1 = require("express");
const room_route_1 = require("./room.route");
function createRootRouter(redisService) {
    const router = (0, express_1.Router)();
    router.use("/room", (0, room_route_1.createRoomRouter)(redisService));
    return router;
}
