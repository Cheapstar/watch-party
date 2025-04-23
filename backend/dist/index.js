"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ioredis_1 = require("ioredis");
const redisClient_1 = __importDefault(require("./redis/redisClient"));
const routes_1 = require("./routes");
const websocketclient_1 = require("./websocket/websocketclient");
const app = (0, express_1.default)();
/*
    Redis Service bhi yaha pe hi chalu kardenge
    and routes ko pass on karna hai jo bhi use karega
*/
const httpServer = app.listen(process.env.PORT, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT}`);
});
const wsClient = new websocketclient_1.WebSocketClient(httpServer);
const redisService = new redisClient_1.default(new ioredis_1.Redis());
app.use(express_1.default.json());
app.use("api/v1/", (0, routes_1.createRootRouter)(redisService));
