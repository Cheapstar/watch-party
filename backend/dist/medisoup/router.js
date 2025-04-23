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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRouter = createRouter;
exports.getRouter = getRouter;
const worker_1 = require("./worker");
const mediasoup_config_1 = require("./config/mediasoup.config");
// Mapping between roomId ----- Router
const ROUTERS = new Map();
function createRouter(roomId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const worker = (0, worker_1.getWorker)();
            const newRouter = yield worker.createRouter(mediasoup_config_1.mediasoupConfig.router);
            ROUTERS.set(roomId, newRouter);
        }
        catch (error) {
            console.log("Error Occured While creating the router for the room with roomId:%id", roomId);
            throw new Error(`Error Occured While creating the router for the room with roomId:${roomId}`);
        }
    });
}
function getRouter(roomId) {
    ensureRouterExists(roomId);
    return ROUTERS.get(roomId);
}
function ensureRouterExists(roomId) {
    if (ROUTERS.has(roomId))
        return;
    console.log(`Router for the given room with roomId:${roomId} does not exists`);
    throw new Error(`Router for the given room with roomId:${roomId} does not exists`);
}
