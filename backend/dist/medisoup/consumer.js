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
exports.createConsumer = createConsumer;
const router_1 = require("./router");
const transports_1 = require("./transports");
const CONSUMERS = new Map();
function createConsumer(roomId, userId, producerId, rtpCaps) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const router = (0, router_1.getRouter)(roomId);
        const recvTransport = (0, transports_1.getRecvTransport)(roomId, userId);
        try {
            if (!(router === null || router === void 0 ? void 0 : router.canConsume({ producerId, rtpCapabilities: rtpCaps }))) {
                throw new Error(`Cannot Consumer this producer`);
            }
            const consumer = yield recvTransport.consume({
                producerId,
                rtpCapabilities: rtpCaps,
                paused: true,
            });
            consumer.on("transportclose", () => {
                var _a, _b, _c;
                (_c = (_b = (_a = CONSUMERS.get(roomId)) === null || _a === void 0 ? void 0 : _a.get(userId)) === null || _b === void 0 ? void 0 : _b.find((c) => c.id === consumer.id)) === null || _c === void 0 ? void 0 : _c.close();
            });
            ensureConsumerExists(roomId);
            (_b = (_a = CONSUMERS.get(roomId)) === null || _a === void 0 ? void 0 : _a.get(userId)) === null || _b === void 0 ? void 0 : _b.push(consumer);
        }
        catch (error) {
            console.log(`Consumer could not be created for the given user with userId:${userId} does not exist in the room with roomId:${roomId}`);
            throw new Error(`Consumer could not be created for the given user with userId:${userId} does not exist in the room with roomId:${roomId}`);
        }
    });
}
function ensureConsumerExists(roomId) {
    if (CONSUMERS.has(roomId))
        return;
    CONSUMERS.set(roomId, new Map());
}
