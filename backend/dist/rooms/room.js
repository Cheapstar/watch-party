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
exports.Room = void 0;
const logger_1 = require("../utils/logger");
class Room {
    constructor(router, roomId, redisService) {
        this.participants = new Map();
        this.getRouter = () => {
            this.ensureRouterInitialised();
            return this.router;
        };
        this.saveParticipant = (participant, userId) => {
            if (this.participants.has(userId)) {
                logger_1.logger.warn(`Participant with userId:${userId} already exists in roomId:${this.roomId}`);
                return;
            }
            this.participants.set(userId, participant);
            logger_1.logger.info(`Participant with userId:${userId} added to roomId:${this.roomId}`);
        };
        this.ensureRouterInitialised = () => {
            if (!this.router) {
                logger_1.logger.error(`Router for the Room with roomId:${this.roomId} is not initialized`);
                throw new Error(`Router for the Room with roomId:${this.roomId} is not initialized`);
            }
        };
        this.removeParticipant = (userId) => __awaiter(this, void 0, void 0, function* () {
            if (!this.participants.has(userId)) {
                logger_1.logger.warn(`Tried to remove non-existing participant with userId:${userId} from roomId:${this.roomId}`);
                return;
            }
            const participant = this.participants.get(userId);
            try {
                participant.close();
                logger_1.logger.info(`Participant with userId:${userId} closed successfully in roomId:${this.roomId}`);
            }
            catch (error) {
                logger_1.logger.error(`Error closing participant with userId:${userId} in roomId:${this.roomId}`, error);
            }
            yield this.redisService.removeUserFromRoom(this.roomId, userId);
            this.participants.delete(userId);
            logger_1.logger.info(`Participant with userId:${userId} removed from roomId:${this.roomId}`);
        });
        this.removeAllParticpants = () => {
            const participants = Array.from(this.participants.keys());
            participants.forEach((p) => this.removeParticipant(p));
            logger_1.logger.info(`All participants removed from roomId:${this.roomId}`);
        };
        this.closeRoom = () => {
            this.removeAllParticpants();
            try {
                this.redisService.deleteRoom(this.roomId);
                this.router.close();
                logger_1.logger.info(`Room with roomId:${this.roomId} closed successfully`);
            }
            catch (error) {
                logger_1.logger.error(`Error while closing router for roomId:${this.roomId}`, error);
            }
        };
        this.getAllParticipantIds = () => {
            return Array.from(this.participants.keys());
        };
        this.getOtherParticipants = ({ userId }) => {
            const otherParticipants = Array.from(this.participants.entries())
                .filter(([id, _]) => id !== userId)
                .map(([_, participant]) => participant);
            return otherParticipants;
        };
        this.getOtherParticipantsUserId = ({ userId }) => {
            const otherParticipants = Array.from(this.participants.keys()).filter((id) => id !== userId);
            return otherParticipants;
        };
        this.getRemainingProducers = ({ userId }) => {
            const remainingParticipantsId = Array.from(this.participants.keys()).filter((p) => p !== userId);
            const remainingProducers = [];
            remainingParticipantsId.forEach((id) => {
                const participant = this.participants.get(id);
                if (!participant) {
                    logger_1.logger.warn(`Participant with userId:${id} not found while getting remaining producers in roomId:${this.roomId}`);
                    return;
                }
                const producerIds = Array.from(participant.producer.keys());
                producerIds.forEach((prodId) => {
                    const producer = participant.producer.get(prodId);
                    if (producer) {
                        remainingProducers.push(producer);
                    }
                    else {
                        logger_1.logger.warn(`Producer with id:${prodId} not found for participant:${id} in roomId:${this.roomId}`);
                    }
                });
            });
            return remainingProducers;
        };
        this.router = router;
        this.roomId = roomId;
        this.redisService = redisService;
        logger_1.logger.info(`Room created with roomId: ${roomId}`);
    }
}
exports.Room = Room;
