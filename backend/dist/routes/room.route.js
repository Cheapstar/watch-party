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
exports.createRoomRouter = createRoomRouter;
const express_1 = require("express");
const rooms_1 = require("../rooms");
const utils_1 = require("../redis/utils");
const ROUTES = {
    createRoom: "/create-room",
    removeUserFromRoom: "/remove-user-from-room",
    joinRoom: "/join-room/:roomId",
    leaveRoom: "/leave-room/:roomId",
    endCall: "/end-call/:roomId",
};
function createRoomRouter(redisService) {
    const router = (0, express_1.Router)();
    router.post(ROUTES.createRoom, (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const { userId, username, roomname } = req.body;
            const userDetails = (0, utils_1.createUserDetails)(userId, username, true);
            const roomDetails = (0, rooms_1.createRoomDetails)(userId, roomname, {
                maxParticipants: 10,
                allowedMedia: {
                    video: true,
                    audio: true,
                    screen: true,
                },
                features: {
                    chat: true,
                    reactions: true,
                },
            });
            const response = yield redisService.createRoom(roomDetails, userDetails);
            res
                .json({
                success: true,
                message: "Room Has been Created Successfully",
                roomId: response,
            })
                .status(200);
        }
        catch (error) {
            console.log(error instanceof Error
                ? error.message
                : "Error Occured While creating the room");
            res
                .json({
                success: false,
                error: error instanceof Error ? error.message : "Couldn't create the room",
            })
                .status(400);
        }
    }));
    router.post(ROUTES.removeUserFromRoom, (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const { roomId, userId, removeUserId } = req.body;
            const isUserHost = yield redisService.isUserHost(roomId, userId);
            if (!isUserHost) {
                res
                    .json({
                    message: "Only Host has permission to remove the users from the room",
                })
                    .status(400);
                return;
            }
            /* Need to handle all the mediasoup server and broadcast message to all the other participants */
            const response = yield redisService.removeUserFromRoom(roomId, removeUserId);
            res
                .json({
                success: true,
                message: "User has been successfully removed from the room",
            })
                .status(200);
        }
        catch (error) {
            console.log(error instanceof Error
                ? error.message
                : "Error Occured While removing user from the room");
            res.json({
                success: false,
                error: error instanceof Error
                    ? error.message
                    : "Could not remove user from the room",
            });
        }
    }));
    router.post(ROUTES.joinRoom, (req, res) => __awaiter(this, void 0, void 0, function* () {
        const { userId, username } = req.body;
        try {
            const roomId = req.params.roomId;
            // Check if the room Exists
            const roomExists = yield redisService.roomExists(roomId);
            if (!roomExists) {
                res
                    .json({
                    error: `Room With the given roomId:${roomId} does not exists`,
                })
                    .status(400);
                return;
            }
            // Room Exists , Save the user
            const userDetails = (0, utils_1.createUserDetails)(userId, username, false);
            const addMember = yield redisService.addMemberToTheRoom(roomId, userDetails);
            // Notify all the participants that user has joined the room , using websocket
            ///
            // Connect this to the mediasoup client
            res
                .json({
                message: "User has successfully joined the room",
            })
                .status(200);
        }
        catch (error) {
            console.log(error instanceof Error
                ? error.message
                : `Error Occured While user with userId:${userId} was joining the room`);
            res.json({
                success: false,
                error: error instanceof Error
                    ? error.message
                    : `Error Occured While user with userId:${userId} was joining the room`,
            });
        }
    }));
    router.post(ROUTES.leaveRoom, (req, res) => __awaiter(this, void 0, void 0, function* () {
        const { userId } = req.body;
        try {
            const roomId = req.params.roomId;
            /*
              Handle all the mediasoup logic here
            */
            const response = yield redisService.removeUserFromRoom(roomId, userId);
            res
                .json({
                message: "User has exited the room successfully",
            })
                .status(200);
        }
        catch (error) {
            console.log(error instanceof Error
                ? error.message
                : `Error Occured While user with userId:${userId} was leaving the room`);
            res
                .json({
                success: false,
                error: error instanceof Error
                    ? error.message
                    : `Error Occured While user with userId:${userId} was leaving the room`,
            })
                .status(400);
        }
    }));
    router.post(ROUTES.endCall, (req, res) => __awaiter(this, void 0, void 0, function* () {
        const { userId } = req.body;
        const roomId = req.params.roomId;
        try {
            const response = yield redisService.isUserHost(roomId, userId);
            if (!response) {
                res
                    .json({
                    error: "User needs to be the host to end the call and You are not that",
                })
                    .status(403);
                return;
            }
            /* Handle all the mediasoup logic  and notify all the other participants about call end*/
            yield redisService.deleteRoom(roomId);
            res
                .json({
                message: "Call has been successfully terminated , ty",
            })
                .status(200);
        }
        catch (error) {
            console.log(error instanceof Error
                ? error.message
                : `Error Occured While ending the call with room:${roomId} was leaving the room`);
            res
                .json({
                success: false,
                error: error instanceof Error
                    ? error.message
                    : `Error Occured While ending the call with room:${roomId} was leaving the room`,
            })
                .status(400);
        }
    }));
    return router;
}
