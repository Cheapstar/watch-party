import { Router } from "express";
import RedisService from "../redis/redisClient.js";
import { createRoomDetails } from "../rooms/index.js";
import { createUserDetails, userDto } from "../redis/utils.js";
import { RoomManager } from "../rooms/roomManager.js";
import { MediaSoupService } from "../medisoup/mediasoupService.js";
import { Room } from "../rooms/room.js";
import { Participant } from "../rooms/participant/participant.js";
import { WebSocketClient } from "../websocket/websocketclient.js";
import { logger } from "../utils/logger.js";

const ROUTES = {
  createRoom: "/create-room",
  removeUserFromRoom: "/remove-user-from-room",
  joinRoom: "/join-room/:roomId",
  leaveRoom: "/leave-room/:roomId",
  endCall: "/end-call/:roomId",
};

export function createRoomRouter(
  redisService: RedisService,
  roomManager: RoomManager,
  mediasoupService: MediaSoupService,
  wsClient: WebSocketClient
) {
  const router = Router();

  router.post(ROUTES.createRoom, async (req, res) => {
    try {
      const { userId, username, roomname } = req.body;

      logger.info(`Creating the room with hostId:${userId}`);

      const userDetails = createUserDetails(userId, username, true);
      const roomDetails = createRoomDetails(userId, roomname, {
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

      const roomId = await redisService.createRoom(roomDetails, userDetails);
      const mediasoupRouter = await mediasoupService.createRouter({ roomId });
      const room = roomManager.createRoom(
        roomId,
        mediasoupRouter,
        redisService
      );

      res
        .json({
          success: true,
          message: "Room Has been Created Successfully",
          roomId: roomId,
        })
        .status(200);
    } catch (error) {
      console.log(
        error instanceof Error
          ? error.message
          : "Error Occured While creating the room"
      );
      res
        .json({
          success: false,
          error:
            error instanceof Error ? error.message : "Couldn't create the room",
        })
        .status(400);
    }
  });

  router.post(ROUTES.removeUserFromRoom, async (req, res) => {
    try {
      const { roomId, userId, removeUserId } = req.body;

      const isUserHost = await redisService.isUserHost(roomId, userId);

      if (!isUserHost) {
        res
          .json({
            message:
              "Only Host has permission to remove the users from the room",
          })
          .status(400);
        return;
      }

      /* Need to handle all the mediasoup server and broadcast message to all the other participants */
      const room = roomManager.getRoom(roomId);
      room?.removeParticipant(removeUserId);

      wsClient.send(removeUserId, "removed-from-room", "");

      const response = await redisService.removeUserFromRoom(
        roomId,
        removeUserId
      );

      res
        .json({
          success: true,
          message: "User has been successfully removed from the room",
        })
        .status(200);
    } catch (error) {
      console.log(
        error instanceof Error
          ? error.message
          : "Error Occured While removing user from the room"
      );
      res.json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not remove user from the room",
      });
    }
  });

  router.post(ROUTES.joinRoom, async (req, res) => {
    const { userId, username } = req.body;

    try {
      const roomId = req.params.roomId;

      logger.info(`Details are userId:${userId} , roomId:${roomId}`);
      // Check if the room Exists
      const roomExists = await redisService.roomExists(roomId);

      if (!roomExists) {
        res
          .json({
            error: `Room With the given roomId:${roomId} does not exists`,
          })
          .status(400);

        return;
      }

      // Room Exists , Save the user
      // Connect this to the mediasoup client
      const room = roomManager.getRoom(roomId) as Room;
      const isHost = await redisService.isUserHost(roomId, userId);
      if (!isHost) {
        const userDetails = createUserDetails(userId, username, isHost);
        const addMember = await redisService.addMemberToTheRoom(
          roomId,
          userDetails
        );

        /*
          Send All the existing users details about this user
        */
        wsClient.broadCastMessage({
          userIds: room.getOtherParticipantsUserId({ userId }),
          type: "new-participant",
          payload: {
            userDetails: userDto(userDetails),
          },
        });
      }

      const participant = new Participant(
        userId,
        room,
        wsClient,
        username,
        isHost
      );

      room.saveParticipant(participant, userId);

      /*
        Return All the user details object for this new-joinee
      */

      const allUserDetails = await redisService.getAllMember(roomId);

      res
        .json({
          success: true,
          message: "User has successfully joined the room",
          data: {
            allUserDetails: allUserDetails,
          },
        })
        .status(200);
    } catch (error) {
      console.log(
        error instanceof Error
          ? error.message
          : `Error Occured While user with userId:${userId} was joining the room`
      );
      res.json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : `Error Occured While user with userId:${userId} was joining the room`,
      });
    }
  });

  router.post(ROUTES.leaveRoom, async (req, res) => {
    const { userId } = req.body;
    try {
      const roomId = req.params.roomId;

      /*
        Handle all the mediasoup logic here 
      */

      const room = roomManager.getRoom(roomId);
      room?.removeParticipant(userId);

      const response = await redisService.removeUserFromRoom(roomId, userId);

      res
        .json({
          message: "User has exited the room successfully",
        })
        .status(200);
    } catch (error) {
      console.log(
        error instanceof Error
          ? error.message
          : `Error Occured While user with userId:${userId} was leaving the room`
      );
      res
        .json({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : `Error Occured While user with userId:${userId} was leaving the room`,
        })
        .status(400);
    }
  });

  router.post(ROUTES.endCall, async (req, res) => {
    const { userId } = req.body;
    const roomId = req.params.roomId;
    try {
      const response = await redisService.isUserHost(roomId, userId);

      if (!response) {
        res
          .json({
            error:
              "User needs to be the host to end the call and You are not that",
          })
          .status(403);
        return;
      }

      /* Yaha hume karna hai Handle all the mediasoup logic  and notify all the other participants about call end*/
      const room = roomManager.getRoom(roomId);
      const participants = room?.getAllParticipantIds();

      /* Broadcast to all the client about room has ended */

      roomManager.deleteRoom(roomId);
      await redisService.deleteRoom(roomId);

      res
        .json({
          message: "Call has been successfully terminated , ty",
        })
        .status(200);
    } catch (error) {
      console.log(
        error instanceof Error
          ? error.message
          : `Error Occured While ending the call with room:${roomId} was leaving the room`
      );
      res
        .json({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : `Error Occured While ending the call with room:${roomId} was leaving the room`,
        })
        .status(400);
    }
  });

  return router;
}
