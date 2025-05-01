import { logger } from "../utils/logger.js";
export class Room {
    constructor(router, roomId, redisService) {
        this.participants = new Map();
        this.getRouter = () => {
            this.ensureRouterInitialised();
            return this.router;
        };
        this.getRoomDetails = async () => {
            const roomDetails = await this.redisService.getRoomDetails(this.roomId);
            return roomDetails;
        };
        this.saveParticipant = (participant, userId) => {
            if (this.participants.has(userId)) {
                logger.warn(`Participant with userId:${userId} already exists in roomId:${this.roomId}`);
                return;
            }
            this.participants.set(userId, participant);
            logger.info(`Participant with userId:${userId} added to roomId:${this.roomId}`);
        };
        this.ensureRouterInitialised = () => {
            if (!this.router) {
                logger.error(`Router for the Room with roomId:${this.roomId} is not initialized`);
                throw new Error(`Router for the Room with roomId:${this.roomId} is not initialized`);
            }
        };
        this.removeParticipant = async (userId) => {
            if (!this.participants.has(userId)) {
                logger.warn(`Tried to remove non-existing participant with userId:${userId} from roomId:${this.roomId}`);
                return;
            }
            const participant = this.participants.get(userId);
            try {
                participant.close();
                logger.info(`Participant with userId:${userId} closed successfully in roomId:${this.roomId}`);
            }
            catch (error) {
                logger.error(`Error closing participant with userId:${userId} in roomId:${this.roomId}`, error);
            }
            await this.redisService.removeUserFromRoom(this.roomId, userId);
            this.participants.delete(userId);
            logger.info(`Participant with userId:${userId} removed from roomId:${this.roomId}`);
        };
        this.removeAllParticpants = () => {
            const participants = Array.from(this.participants.keys());
            participants.forEach((p) => this.removeParticipant(p));
            logger.info(`All participants removed from roomId:${this.roomId}`);
        };
        this.closeRoom = () => {
            this.removeAllParticpants();
            try {
                this.redisService.deleteRoom(this.roomId);
                this.router.close();
                logger.info(`Room with roomId:${this.roomId} closed successfully`);
            }
            catch (error) {
                logger.error(`Error while closing router for roomId:${this.roomId}`, error);
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
                    logger.warn(`Participant with userId:${id} not found while getting remaining producers in roomId:${this.roomId}`);
                    return;
                }
                const producerIds = Array.from(participant.producer.keys());
                producerIds.forEach((prodId) => {
                    const producer = participant.producer.get(prodId);
                    if (producer) {
                        remainingProducers.push(producer);
                    }
                    else {
                        logger.warn(`Producer with id:${prodId} not found for participant:${id} in roomId:${this.roomId}`);
                    }
                });
            });
            return remainingProducers;
        };
        this.saveExternalMedia = async ({ url }) => {
            try {
                logger.info(`Saving the external Media in the redis:${url}`);
                const roomDetails = await this.redisService.getRoomDetails(this.roomId);
                roomDetails.externalMedia = url;
                this.redisService.saveRoom(this.roomId, roomDetails);
            }
            catch (error) {
                logger.error(`Error Occured While saving the external media ${error}`);
                throw error;
            }
        };
        this.removeExternalMedia = async () => {
            try {
                logger.info(`Removing the external Media in the redis`);
                const roomDetails = await this.redisService.getRoomDetails(this.roomId);
                roomDetails.externalMedia = "";
                this.redisService.saveRoom(this.roomId, roomDetails);
            }
            catch (error) {
                logger.error(`Error Occured While removing the external media ${error}`);
                throw error;
            }
        };
        this.router = router;
        this.roomId = roomId;
        this.redisService = redisService;
        logger.info(`Room created with roomId: ${roomId}`);
    }
}
