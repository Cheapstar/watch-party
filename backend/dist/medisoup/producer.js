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
exports.createProducer = createProducer;
const transports_1 = require("./transports");
const PRODUCERS = new Map();
function createProducer(roomId, userId, kind, rtpParams) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const sendTransport = (0, transports_1.getSendTransport)(roomId, userId);
        try {
            const producer = yield sendTransport.produce({
                kind,
                rtpParameters: rtpParams,
            });
            ensureRoomExists(roomId);
            (_b = (_a = PRODUCERS.get(roomId)) === null || _a === void 0 ? void 0 : _a.get(userId)) === null || _b === void 0 ? void 0 : _b.push(producer);
            return producer.id;
        }
        catch (error) {
            console.log(`Producer could not be created for the given user with userId:${userId} does not exist in the room with roomId:${roomId}`);
            throw new Error(`Producer could not be created for the given user with userId:${userId} does not exist in the room with roomId:${roomId}`);
        }
    });
}
function ensureRoomExists(roomId) {
    if (PRODUCERS.has(roomId))
        return;
    PRODUCERS.set(roomId, new Map());
}
