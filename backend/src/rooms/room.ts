import { Router } from "mediasoup/node/lib/RouterTypes";
import { Participant } from "./participant/participant";
import { Producer } from "mediasoup/node/lib/ProducerTypes";
import { logger } from "../utils/logger";
import RedisService from "../redis/redisClient";

export class Room {
  public router: Router;
  public roomId: string;
  public participants: Map<string, Participant> = new Map();
  private redisService: RedisService;

  constructor(router: Router, roomId: string, redisService: RedisService) {
    this.router = router;
    this.roomId = roomId;
    this.redisService = redisService;
    logger.info(`Room created with roomId: ${roomId}`);
  }

  getRouter = () => {
    this.ensureRouterInitialised();
    return this.router;
  };

  saveParticipant = (participant: Participant, userId: string) => {
    if (this.participants.has(userId)) {
      logger.warn(
        `Participant with userId:${userId} already exists in roomId:${this.roomId}`
      );
      return;
    }
    this.participants.set(userId, participant);
    logger.info(
      `Participant with userId:${userId} added to roomId:${this.roomId}`
    );
  };

  ensureRouterInitialised = () => {
    if (!this.router) {
      logger.error(
        `Router for the Room with roomId:${this.roomId} is not initialized`
      );
      throw new Error(
        `Router for the Room with roomId:${this.roomId} is not initialized`
      );
    }
  };

  removeParticipant = async (userId: string) => {
    if (!this.participants.has(userId)) {
      logger.warn(
        `Tried to remove non-existing participant with userId:${userId} from roomId:${this.roomId}`
      );
      return;
    }

    const participant = this.participants.get(userId) as Participant;
    try {
      participant.close();
      logger.info(
        `Participant with userId:${userId} closed successfully in roomId:${this.roomId}`
      );
    } catch (error) {
      logger.error(
        `Error closing participant with userId:${userId} in roomId:${this.roomId}`,
        error
      );
    }

    await this.redisService.removeUserFromRoom(this.roomId, userId);
    this.participants.delete(userId);
    logger.info(
      `Participant with userId:${userId} removed from roomId:${this.roomId}`
    );
  };

  removeAllParticpants = () => {
    const participants = Array.from(this.participants.keys());
    participants.forEach((p) => this.removeParticipant(p));
    logger.info(`All participants removed from roomId:${this.roomId}`);
  };

  closeRoom = () => {
    this.removeAllParticpants();
    try {
      this.redisService.deleteRoom(this.roomId);
      this.router.close();
      logger.info(`Room with roomId:${this.roomId} closed successfully`);
    } catch (error) {
      logger.error(
        `Error while closing router for roomId:${this.roomId}`,
        error
      );
    }
  };

  getAllParticipantIds = () => {
    return Array.from(this.participants.keys());
  };

  getOtherParticipants = ({ userId }: { userId: string }) => {
    const otherParticipants = Array.from(this.participants.entries())
      .filter(([id, _]) => id !== userId)
      .map(([_, participant]) => participant);

    return otherParticipants;
  };

  getOtherParticipantsUserId = ({ userId }: { userId: string }) => {
    const otherParticipants = Array.from(this.participants.keys()).filter(
      (id) => id !== userId
    );

    return otherParticipants;
  };

  getRemainingProducers = ({ userId }: { userId: string }) => {
    const remainingParticipantsId = Array.from(this.participants.keys()).filter(
      (p) => p !== userId
    );

    const remainingProducers: Producer[] = [];

    remainingParticipantsId.forEach((id) => {
      const participant = this.participants.get(id);
      if (!participant) {
        logger.warn(
          `Participant with userId:${id} not found while getting remaining producers in roomId:${this.roomId}`
        );
        return;
      }

      const producerIds = Array.from(participant.producer.keys());
      producerIds.forEach((prodId) => {
        const producer = participant.producer.get(prodId);
        if (producer) {
          remainingProducers.push(producer);
        } else {
          logger.warn(
            `Producer with id:${prodId} not found for participant:${id} in roomId:${this.roomId}`
          );
        }
      });
    });

    return remainingProducers;
  };
}
