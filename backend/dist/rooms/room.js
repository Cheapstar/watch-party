import { logger } from "../utils/logger.js";
import { LiveChatNotInitialised, LiveChatService, } from "../LiveChat/liveChat.js";
export class Room {
    constructor(router, roomId, redisService, roomManager) {
        this.participants = new Map();
        this.getRouter = () => {
            this.ensureRouterInitialised();
            return this.router;
        };
        this.getLiveChat = () => {
            if (!this.liveChatService)
                throw new LiveChatNotInitialised(this.roomId);
            return this.liveChatService;
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
                this.roomManager.ensureRoomExists(this.roomId);
                const exists = this.userExists(userId);
                if (!exists) {
                    logger.error(`User ${userId} Does not exists in room ${this.roomId}`);
                    throw new Error(`User ${userId} Does not exists in room ${this.roomId}`);
                }
                const redisClient = this.redisService.getClient();
                await redisClient.hdel(this.redisService.getKey.members(this.roomId), userId);
                logger.info(`Participant with userId:${userId} closed successfully in roomId:${this.roomId}`);
            }
            catch (error) {
                logger.error(`Error closing participant with userId:${userId} in roomId:${this.roomId}`, error);
            }
            this.participants.delete(userId);
        };
        this.removeAllParticpants = () => {
            const participants = Array.from(this.participants.keys());
            participants.forEach((p) => this.removeParticipant(p));
            logger.info(`All participants removed from roomId:${this.roomId}`);
        };
        this.closeRoom = () => {
            this.removeAllParticpants();
            try {
                this.router.close();
                this.roomManager.deleteRoom(this.roomId);
                logger.info(`Room with roomId:${this.roomId} closed successfully`);
            }
            catch (error) {
                logger.error(`Error while closing router for roomId:${this.roomId}`, error);
                throw error;
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
                const roomDetails = await this.getDetails();
                roomDetails.externalMedia = url;
                this.roomManager.saveRoom(this.roomId, roomDetails);
            }
            catch (error) {
                logger.error(`Error Occured While saving the external media ${error}`);
                throw error;
            }
        };
        this.removeExternalMedia = async () => {
            try {
                logger.info(`Removing the external Media in the redis`);
                const roomDetails = await this.getDetails();
                roomDetails.externalMedia = "";
                this.roomManager.saveRoom(this.roomId, roomDetails);
            }
            catch (error) {
                logger.error(`Error Occured While removing the external media ${error}`);
                throw error;
            }
        };
        // From Redis
        this.addMemberToTheRoom = async (userDetails, participant, userId, isHost) => {
            try {
                if (this.participants.has(userId)) {
                    logger.warn(`Participant with userId:${userId} already exists in roomId:${this.roomId}`);
                    return;
                }
                this.participants.set(userId, participant);
                if (!isHost) {
                    await this.roomManager.ensureRoomExists(this.roomId);
                    const redisClient = this.redisService.getClient();
                    const res = await redisClient.hset(this.redisService.getKey.members(this.roomId), userDetails.userId, JSON.stringify(userDetails));
                    if (!res)
                        throw new Error("Failed to add member to Redis");
                }
                logger.info(`Member ${userDetails.userId} added to room ${this.roomId}`);
            }
            catch (error) {
                logger.error(`Failed to add member ${userDetails.userId} to room ${this.roomId}`, { error });
                throw error;
            }
        };
        this.isRoomEmpty = async () => {
            try {
                const redisClient = this.redisService.getClient();
                const len = await redisClient.hlen(this.redisService.getKey.members(this.roomId));
                logger.info(`Checked if room ${this.roomId} is empty: ${len === 0}`);
                return len === 0;
            }
            catch (error) {
                logger.error(`Error checking if room ${this.roomId} is empty`, { error });
                throw error;
            }
        };
        this.getMemberDetails = async (userId) => {
            try {
                await this.roomManager.ensureRoomExists(this.roomId);
                const redisClient = this.redisService.getClient();
                const res = await redisClient.hget(this.redisService.getKey.members(this.roomId), userId);
                if (!res)
                    throw new Error(`Member ${userId} not found in room ${this.roomId}`);
                logger.info(`Fetched member ${userId} from room ${this.roomId}`);
                return JSON.parse(res);
            }
            catch (error) {
                logger.error(`Failed to get member ${userId} from room ${this.roomId}`, {
                    error,
                });
                throw error;
            }
        };
        this.getAllMember = async () => {
            try {
                await this.roomManager.ensureRoomExists(this.roomId);
                const redisClient = this.redisService.getClient();
                const members = await redisClient.hvals(this.redisService.getKey.members(this.roomId));
                logger.info(`Fetched all members of room ${this.roomId}`);
                return members.map((m) => JSON.parse(m));
            }
            catch (error) {
                logger.error(`Error fetching members of room ${this.roomId}`, { error });
                throw error;
            }
        };
        this.getDetails = async () => {
            try {
                await this.roomManager.ensureRoomExists(this.roomId);
                const redisClient = this.redisService.getClient();
                const res = await redisClient.hget(this.redisService.getKey.rooms(), this.roomId);
                if (!res)
                    throw new Error(`Room details for ${this.roomId} not found`);
                logger.info(`Fetched room details for ${this.roomId}`);
                return JSON.parse(res);
            }
            catch (error) {
                logger.error(`Error fetching room details for ${this.roomId}`, { error });
                throw error;
            }
        };
        this.userExists = async (userId) => {
            try {
                await this.roomManager.ensureRoomExists(this.roomId);
                logger.info(`Checking Does User with userId:${userId} Exists or not in the room ${this.roomId}`);
                const redisClient = this.redisService.getClient();
                const userExists = await redisClient.hexists(this.redisService.getKey.members(this.roomId), userId);
                logger.info(`UserExists result : ${userExists}`);
                return Boolean(userExists);
            }
            catch (error) {
                logger.error(`Error checking user exists for user ${userId} in room ${this.roomId}: ${error instanceof Error ? error.stack : error}`);
                throw error;
            }
        };
        this.isUserHost = async (userId) => {
            try {
                await this.roomManager.ensureRoomExists(this.roomId);
                const exists = await this.userExists(userId);
                logger.info(`User Exists or not ${exists}`);
                if (!exists)
                    return false;
                const redisClient = this.redisService.getClient();
                const res = await redisClient.hget(this.redisService.getKey.members(this.roomId), userId);
                console.log("User Details", res);
                if (!res)
                    throw new Error(`User ${userId} not found in room ${this.roomId}`);
                const userDetails = JSON.parse(res);
                logger.info(`Checked host status for user ${userId} in room ${this.roomId}: ${userDetails.isHost}`);
                return userDetails.isHost;
            }
            catch (error) {
                logger.error(`Error checking host status for user ${userId} in room ${this.roomId}: ${error instanceof Error ? error.stack : error}`);
                throw error;
            }
        };
        this.router = router;
        this.roomId = roomId;
        this.redisService = redisService;
        this.roomManager = roomManager;
        this.liveChatService = new LiveChatService(redisService, roomId);
        logger.info(`Room created with roomId: ${roomId}`);
    }
}
