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
exports.createSendTransport = createSendTransport;
exports.connectSendTransport = connectSendTransport;
exports.createRecvTransport = createRecvTransport;
exports.connectRecvTransport = connectRecvTransport;
exports.getSendTransport = getSendTransport;
exports.getRecvTransport = getRecvTransport;
const router_1 = require("./router");
const mediasoup_config_1 = require("./config/mediasoup.config");
/*
    mapping between roomId ----- (userId ------ WebRtcTransport)
    room k hisab se transports store karte hai
    easier for broadcasting ????
    */
const SENDTRANSPORTS = new Map();
const RECVTRANSPORTS = new Map();
function createSendTransport(roomId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const router = (0, router_1.getRouter)(roomId);
        try {
            const sendTransport = yield router.createWebRtcTransport(mediasoup_config_1.mediasoupConfig.webRtcTransport);
            // userId ---- transport
            // First check if the map exists or not
            // if exists => room has already been initialised and participants are already there
            ensureRoomExists(roomId, "s");
            (_a = SENDTRANSPORTS.get(roomId)) === null || _a === void 0 ? void 0 : _a.set(userId, sendTransport);
            return {
                id: sendTransport.id,
                iceCandidates: sendTransport.iceCandidates,
                iceParameters: sendTransport.iceParameters,
                dtlsParameters: sendTransport.dtlsParameters,
            };
        }
        catch (error) {
            console.log(`Error Occured While creating the send Transport for the user with userId:${userId} in the room with roomId:${roomId}`);
            throw new Error(`Error Occured While creating the send Transport for the user with userId:${userId} in the room with roomId:${roomId}`);
        }
    });
}
function connectSendTransport(roomId, userId, dtlsParameters) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        ensureSendTransportInitialized(roomId, userId);
        try {
            const sendTransport = (_a = SENDTRANSPORTS.get(roomId)) === null || _a === void 0 ? void 0 : _a.get(userId);
            yield sendTransport.connect({ dtlsParameters });
            return sendTransport.id;
        }
        catch (error) {
            console.log(`Could not connect send Transport for the user with userId:${userId} inside room with roomId:${roomId}`);
            throw new Error(`Could not connect send Transport for the user with userId:${userId} inside room with roomId:${roomId}`);
        }
    });
}
function ensureSendTransportInitialized(roomId, userId) {
    var _a;
    if (SENDTRANSPORTS.has(roomId)) {
        return (_a = SENDTRANSPORTS.get(roomId)) === null || _a === void 0 ? void 0 : _a.has(userId);
    }
    console.log(`Send Transport for the user with userId:${userId}, in the room ${roomId} does not exists`);
    throw new Error(`Send Transport for the user with userId:${userId}, in the room ${roomId} does not exists`);
}
function createRecvTransport(roomId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const router = (0, router_1.getRouter)(roomId);
        try {
            const recvTransport = yield router.createWebRtcTransport(mediasoup_config_1.mediasoupConfig.webRtcTransport);
            // userId ---- transport
            // First check if the map exists or not
            // if exists => room has already been initialised and participants are already there
            ensureRoomExists(roomId, "r");
            (_a = RECVTRANSPORTS.get(roomId)) === null || _a === void 0 ? void 0 : _a.set(userId, recvTransport);
            return {
                id: recvTransport.id,
                iceCandidates: recvTransport.iceCandidates,
                iceParameters: recvTransport.iceParameters,
                dtlsParameters: recvTransport.dtlsParameters,
            };
        }
        catch (error) {
            console.log(`Error Occured While creating the send Transport for the user with userId:${userId} in the room with roomId:${roomId}`);
            throw new Error(`Error Occured While creating the send Transport for the user with userId:${userId} in the room with roomId:${roomId}`);
        }
    });
}
function connectRecvTransport(roomId, userId, dtlsParameters) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        ensureRecvTransportInitialized(roomId, userId);
        try {
            const recvTransport = (_a = RECVTRANSPORTS.get(roomId)) === null || _a === void 0 ? void 0 : _a.get(userId);
            yield recvTransport.connect({ dtlsParameters });
            return recvTransport.id;
        }
        catch (error) {
            console.log(`Could not connect send Transport for the user with userId:${userId} inside room with roomId:${roomId}`);
            throw new Error(`Could not connect send Transport for the user with userId:${userId} inside room with roomId:${roomId}`);
        }
    });
}
function ensureRecvTransportInitialized(roomId, userId) {
    var _a;
    if (RECVTRANSPORTS.has(roomId)) {
        return (_a = RECVTRANSPORTS.get(roomId)) === null || _a === void 0 ? void 0 : _a.has(userId);
    }
    console.log(`Recv Transport for the user with userId:${userId}, in the room ${roomId} does not exists`);
    throw new Error(`Recv Transport for the user with userId:${userId}, in the room ${roomId} does not exists`);
}
function ensureRoomExists(roomId, marker) {
    if (marker === "s") {
        if (SENDTRANSPORTS.has(roomId))
            return;
        SENDTRANSPORTS.set(roomId, new Map());
        return;
    }
    if (marker === "r") {
        if (RECVTRANSPORTS.has(roomId))
            return;
        RECVTRANSPORTS.set(roomId, new Map());
        return;
    }
}
function getSendTransport(roomId, userId) {
    var _a;
    ensureSendTransportInitialized(roomId, userId);
    return (_a = SENDTRANSPORTS.get(roomId)) === null || _a === void 0 ? void 0 : _a.get(userId);
}
function getRecvTransport(roomId, userId) {
    var _a;
    ensureRecvTransportInitialized(roomId, userId);
    return (_a = RECVTRANSPORTS.get(roomId)) === null || _a === void 0 ? void 0 : _a.get(userId);
}
