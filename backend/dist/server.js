"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const ioredis_1 = require("ioredis");
const redisClient_1 = __importDefault(require("./redis/redisClient"));
const routes_1 = require("./routes");
const websocketclient_1 = require("./websocket/websocketclient");
const cors_1 = __importDefault(require("cors"));
const roomManager_1 = require("./rooms/roomManager");
const mediasoupService_1 = require("./medisoup/mediasoupService");
const logger_1 = require("./utils/logger");
dotenv_1.default.config();
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = (0, express_1.default)();
        /*
        Redis Service bhi yaha pe hi chalu kardenge
        and routes ko pass on karna hai jo bhi use karega
        */
        const httpServer = app.listen(process.env.PORT, () => {
            console.log(`Server is running on http://localhost:${process.env.PORT}`);
        });
        const mediasoupService = new mediasoupService_1.MediaSoupService();
        const roomManager = new roomManager_1.RoomManager();
        const wsClient = new websocketclient_1.WebSocketClient(httpServer);
        const redisService = new redisClient_1.default(new ioredis_1.Redis());
        yield mediasoupService.createWorker();
        app.use((0, cors_1.default)());
        app.use(express_1.default.json());
        app.use("/api/v1/", (0, routes_1.createRootRouter)(redisService, roomManager, mediasoupService, wsClient));
        process.on("SIGTERM", () => {
            logger_1.logger.info("SIGTERM received. Shutting down gracefully...");
            httpServer.close(() => {
                logger_1.logger.info("Server closed");
                process.exit(0);
            });
        });
    });
}
startServer();
