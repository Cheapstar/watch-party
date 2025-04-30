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
exports.Participant = void 0;
const mediasoup_config_1 = require("../../medisoup/config/mediasoup.config");
const logger_1 = require("../../utils/logger");
class Participant {
    constructor(userId, room, ws, username, isHost) {
        this.producer = new Map();
        this.consumer = new Map();
        this.getRtpCapabilities = ({ userId, payload }) => {
            logger_1.logger.info(`Request for RTP capabilities from user ${userId}`, {
                label: "Participant",
            });
            this.wsClient.send(userId, "rtpCapabilities", {
                routerRtpCapabilities: this.room.getRouter().rtpCapabilities,
            });
        };
        this.saveUserRtpCapabilities = ({ userId, payload }) => {
            const { rtpCapabilities } = payload;
            if (!rtpCapabilities) {
                logger_1.logger.warn(`No RTP capabilities provided by user ${userId}`, {
                    label: "Participant",
                });
                return;
            }
            /* Saving the Client's Rtp Capabilities to reduce extra overhead */
            this.rtpCapabilities = rtpCapabilities;
            logger_1.logger.debug(`Saved RTP capabilities for user ${userId}`, {
                label: "Participant",
            });
        };
        this.createTransport = (_a) => __awaiter(this, [_a], void 0, function* ({ userId, payload }) {
            const router = this.room.getRouter();
            try {
                const { direction } = payload;
                if (!direction || (direction !== "recv" && direction !== "send")) {
                    logger_1.logger.error(`Invalid transport direction: ${direction}`, {
                        label: "Participant",
                    });
                    throw new Error("Invalid transport direction");
                }
                logger_1.logger.debug(`Creating ${direction} transport for user ${userId}`, {
                    label: "Participant",
                });
                const transport = yield router.createWebRtcTransport(mediasoup_config_1.mediasoupConfig.webRtcTransport);
                if (direction === "recv") {
                    this.recvTransport = transport;
                }
                else {
                    this.sendTransport = transport;
                }
                const transportInfo = {
                    id: transport.id,
                    iceCandidates: transport.iceCandidates,
                    iceParameters: transport.iceParameters,
                    dtlsParameters: transport.dtlsParameters,
                };
                this.wsClient.send(userId, "transport-created", {
                    direction: direction,
                    transportInfo,
                });
                logger_1.logger.info(`Transport ${direction} created successfully for user ${userId}`, {
                    label: "Participant",
                    transportId: transport.id,
                });
            }
            catch (error) {
                logger_1.logger.error(`Error creating ${payload.direction} transport for user ${userId}: ${error}`, {
                    label: "Participant",
                    error,
                });
                const message = `Error while creating the ${payload.direction} transport`;
                this.wsClient.send(userId, "error", {
                    code: `${payload.direction.toUpperCase()}_TRANSPORT_CREATE_FAILED`,
                    message,
                });
            }
        });
        this.connectTransport = (_a) => __awaiter(this, [_a], void 0, function* ({ userId, payload }) {
            try {
                const { direction, dtlsParameters } = payload;
                this.ensureTransportInitialized(direction);
                const transport = this.getTransport(direction);
                transport === null || transport === void 0 ? void 0 : transport.connect({ dtlsParameters });
                this.wsClient.send(userId, "transport-connected", {
                    transportId: transport.id,
                    direction,
                });
                logger_1.logger.info(`Transport ${transport.id} connected for user ${userId}`, {
                    label: "Participant",
                    direction,
                });
            }
            catch (error) {
                logger_1.logger.error(`Error connecting ${payload.direction} transport for user ${userId}: ${error}`, {
                    label: "Participant",
                    error,
                });
                const message = `Error while connecting with the ${payload.direction} transport`;
                this.wsClient.send(userId, "error", {
                    code: `${payload.direction.toUpperCase()}_TRANSPORT_CONNECT_FAILED`,
                    message,
                });
            }
        });
        this.createProducer = (_a) => __awaiter(this, [_a], void 0, function* ({ userId, payload }) {
            try {
                this.ensureTransportInitialized("send");
                const { kind, rtpParameters, producerData } = payload;
                const transport = this.sendTransport;
                logger_1.logger.debug(`Creating producer of kind ${kind} for user ${userId}`, {
                    label: "Participant",
                    producerData,
                });
                const producer = yield transport.produce({
                    kind,
                    rtpParameters,
                    appData: Object.assign({}, producerData),
                });
                this.producer.set(producer.id, producer);
                // this is for broadcasting
                this.broadcastNewProducer(producer, producerData.type);
                this.wsClient.send(userId, "producer-created", {
                    producerId: producer.id,
                });
                producer.on("transportclose", () => {
                    logger_1.logger.info(`Producer ${producer.id} transport closed`, {
                        label: "Participant",
                        producerId: producer.id,
                    });
                    this.producer.delete(producer.id);
                    const userIds = this.room.getOtherParticipantsUserId({
                        userId: this.userId,
                    });
                    this.wsClient.broadCastMessage({
                        userIds,
                        type: "remove-consumer",
                        payload: {
                            producerId: producer.id,
                        },
                    });
                });
                producer.on("@close", () => {
                    logger_1.logger.info(`Producer ${producer.id} closed`, {
                        label: "Participant",
                        producerId: producer.id,
                    });
                    this.producer.delete(producer.id);
                    const userIds = this.room.getOtherParticipantsUserId({
                        userId: this.userId,
                    });
                    this.wsClient.broadCastMessage({
                        userIds,
                        type: "remove-consumer",
                        payload: {
                            producerId: producer.id,
                        },
                    });
                });
                logger_1.logger.info(`New ${kind} producer created for user ${userId}`, {
                    label: "Participant",
                    producerId: producer.id,
                    kind,
                });
            }
            catch (error) {
                logger_1.logger.error(`Error creating producer for user ${userId}: ${error}`, {
                    label: "Participant",
                    error,
                });
                this.wsClient.send(userId, "error", {
                    code: "PRODUCE_MEDIA_ERROR",
                    message: "Couldn't Producer the Media",
                });
            }
        });
        this.broadcastNewProducer = (producer, producerType) => {
            logger_1.logger.debug(`Broadcasting new producer ${producer.id} of type ${producerType}`, {
                label: "Participant",
                producerId: producer.id,
                producerType,
            });
            // Get all other participants in the room
            const otherParticipants = this.room.getOtherParticipants({
                userId: this.userId,
            });
            // Send a notification to each participant
            otherParticipants.forEach((participant) => {
                participant.wsClient.send(participant.userId, "new-producer-available", {
                    producerId: producer.id,
                    producerUserId: this.userId,
                    kind: producer.kind,
                    producerType: producerType, // camera, microphone, screen
                    producerUsername: this.username,
                });
            });
        };
        this.createConsumer = (_a) => __awaiter(this, [_a], void 0, function* ({ userId, payload }) {
            try {
                const router = this.room.getRouter();
                this.ensureTransportInitialized("recv");
                const { producerId, rtpCapabilities, producerType, producerUserId, producerUsername, } = payload;
                logger_1.logger.debug(`Creating consumer for producer ${producerId} for user ${userId}`, {
                    label: "Participant",
                    producerId,
                });
                // Check if client can consume this producer
                if (!router.canConsume({ producerId, rtpCapabilities })) {
                    logger_1.logger.warn(`User ${userId} cannot consume producer ${producerId}`, {
                        label: "Participant",
                        producerId,
                    });
                    throw new Error("Client cannot consume this producer");
                }
                const recvTransport = this.recvTransport;
                const consumer = yield recvTransport.consume({
                    producerId,
                    rtpCapabilities,
                    paused: true,
                });
                this.consumer.set(consumer.id, consumer);
                consumer.on("transportclose", () => {
                    logger_1.logger.info(`Consumer ${consumer.id} transport closed`, {
                        label: "Participant",
                        consumerId: consumer.id,
                    });
                    this.consumer.delete(consumer.id);
                });
                consumer.on("@close", () => {
                    logger_1.logger.info(`Consumer ${consumer.id} closed`, {
                        label: "Participant",
                        consumerId: consumer.id,
                    });
                    this.consumer.delete(consumer.id);
                });
                this.wsClient.send(userId, "new-consumer", {
                    consumerOptions: {
                        id: consumer.id,
                        producerId: consumer.producerId,
                        kind: consumer.kind,
                        rtpParameters: consumer.rtpParameters,
                        appData: { type: producerType, producerUserId, producerUsername },
                    },
                });
                logger_1.logger.info(`Created new consumer ${consumer.id} for user ${userId}`, {
                    label: "Participant",
                    consumerId: consumer.id,
                    producerId,
                });
            }
            catch (error) {
                logger_1.logger.error(`Error creating consumer for user ${userId}: ${error}`, {
                    label: "Participant",
                    error,
                });
                this.wsClient.send(userId, "error", {
                    code: "CREATE_CONSUMER_FAILED",
                    message: "Error while creating the consumer",
                });
                throw new Error("Error while creating the consumer");
            }
        });
        this.resumeConsumer = (_a) => __awaiter(this, [_a], void 0, function* ({ userId, payload: { consumerId } }) {
            try {
                const consumer = this.consumer.get(consumerId);
                if (!consumer) {
                    logger_1.logger.warn(`Consumer ${consumerId} not found for user ${userId}`, {
                        label: "Participant",
                        consumerId,
                    });
                    this.wsClient.send(userId, "error", {
                        code: "CONSUMER_NOT_FOUND",
                        message: "Consumer not found",
                    });
                    return;
                }
                yield consumer.resume();
                this.wsClient.send(userId, "consumer-resumed", {
                    consumerId: consumer.id,
                });
                logger_1.logger.info(`Resumed consumer ${consumer.id} for user ${userId}`, {
                    label: "Participant",
                    consumerId: consumer.id,
                });
            }
            catch (error) {
                logger_1.logger.error(`Error resuming consumer ${consumerId} for user ${userId}: ${error}`, {
                    label: "Participant",
                    consumerId,
                    error,
                });
                this.wsClient.send(userId, "error", {
                    code: "RESUME_CONSUMER_FAILED",
                    message: "Failed to resume consumer",
                });
            }
        });
        this.getTransport = (direction) => {
            if (direction === "recv") {
                return this.recvTransport;
            }
            if (direction === "send") {
                return this.sendTransport;
            }
        };
        this.ensureTransportInitialized = (direction) => {
            if (direction === "recv") {
                if (!this.recvTransport) {
                    const error = `Recv Transport for user with userId:${this.userId} is not initialized`;
                    logger_1.logger.error(error, { label: "Participant" });
                    throw new Error(error);
                }
            }
            if (direction === "send") {
                if (!this.sendTransport) {
                    const error = `Send Transport for user with userId:${this.userId} is not initialized`;
                    logger_1.logger.error(error, { label: "Participant" });
                    throw new Error(error);
                }
            }
        };
        this.removeProducer = ({ userId, payload }) => {
            const { producerId, type } = payload;
            logger_1.logger.info(`Removing producer ${producerId} of type ${type}`, {
                label: "Participant",
                producerId,
                type,
            });
            this.producer.delete(producerId);
            const userIds = this.room.getOtherParticipantsUserId({
                userId: this.userId,
            });
            this.wsClient.broadCastMessage({
                userIds,
                type: "remove-consumer",
                payload: {
                    producerUserId: this.userId,
                    type,
                },
            });
        };
        this.sendStreams = (_a) => __awaiter(this, [_a], void 0, function* ({ userId, payload }) {
            const participants = this.room.getOtherParticipants({
                userId: this.userId,
            });
            if (participants.length < 1) {
                logger_1.logger.debug(`No other participants to send streams to for user ${userId}`, {
                    label: "Participant",
                });
                return;
            }
            const { rtpCapabilities } = payload;
            logger_1.logger.debug(`Sending streams to user ${userId} from ${participants.length} participants`, {
                label: "Participant",
            });
            logger_1.logger.info(`Total Participants Present are ${participants.length}`);
            for (let i = 0; i < participants.length; i++) {
                const participantProducers = Array.from(participants[i].producer.values());
                logger_1.logger.info(`Total producer for participant ${i} is ${participantProducers.length}`);
                for (let j = 0; j < participantProducers.length; j++) {
                    yield this.createConsumer({
                        userId: this.userId,
                        payload: {
                            producerId: participantProducers[j].id,
                            rtpCapabilities: rtpCapabilities,
                            producerType: participantProducers[j].appData.type,
                            producerUserId: participantProducers[j].appData.producerUserId,
                            producerUsername: participants[i].username,
                        },
                    });
                }
            }
        });
        this.endCall = (_a) => __awaiter(this, [_a], void 0, function* ({ userId, payload }) {
            if (!this.isHost) {
                this.wsClient.send(userId, "not-allowed", {
                    code: "NOT_ALLOWED",
                    message: "You don't have permission to execute that operation",
                });
                return;
            }
            logger_1.logger.info(`Host ${this.userId} is ending the call`, {
                label: "Participant",
            });
            // Notify all participants
            this.wsClient.broadCastMessage({
                userIds: this.room.getAllParticipantIds(),
                type: "call-ended",
                payload: {
                    message: "Call has been ended by host",
                },
            });
            // Close all resources for this participant
            this.close();
            // Close the entire room
            this.room.closeRoom();
        });
        this.exitRoom = (_a) => __awaiter(this, [_a], void 0, function* ({ userId, payload }) {
            logger_1.logger.info(`Participant ${this.userId} is exiting the room`, {
                label: "Participant",
            });
            // Notify other participants
            this.wsClient.broadCastMessage({
                userIds: this.room.getOtherParticipantsUserId({ userId: userId }),
                type: "user-exited-room",
                payload: {
                    exitedUserId: this.userId,
                },
            });
            this.wsClient.send(this.userId, "room-exited", {
                message: "Room Exited Successfully",
            });
            // Close all resources
            this.close();
            // Remove from room
            yield this.room.removeParticipant(this.userId);
        });
        this.close = () => {
            logger_1.logger.info(`Closing all resources for participant ${this.userId}`, {
                label: "Participant",
            });
            // Close all producers
            this.producer.forEach((producer) => {
                logger_1.logger.debug(`Closing producer ${producer.id}`, {
                    label: "Participant",
                    producerId: producer.id,
                });
                producer.close();
                // Notify other participants to remove consumer
                this.wsClient.broadCastMessage({
                    userIds: this.room.getOtherParticipantsUserId({ userId: this.userId }),
                    type: "remove-consumer",
                    payload: {
                        producerId: producer.id,
                        type: producer.appData.type,
                    },
                });
            });
            this.producer.clear();
            // Close all consumers
            this.consumer.forEach((consumer) => {
                logger_1.logger.debug(`Closing consumer ${consumer.id}`, {
                    label: "Participant",
                    consumerId: consumer.id,
                });
                consumer.close();
            });
            this.consumer.clear();
            // Close transports
            if (this.sendTransport) {
                logger_1.logger.debug(`Closing send transport ${this.sendTransport.id}`, {
                    label: "Participant",
                    transportId: this.sendTransport.id,
                });
                this.sendTransport.close();
                this.sendTransport = undefined;
            }
            if (this.recvTransport) {
                logger_1.logger.debug(`Closing recv transport ${this.recvTransport.id}`, {
                    label: "Participant",
                    transportId: this.recvTransport.id,
                });
                this.recvTransport.close();
                this.recvTransport = undefined;
            }
            // Disable all event listeners
            this.disableParticipant();
        };
        this.initializeParticipant = () => {
            logger_1.logger.debug(`Initializing participant ${this.userId}`, {
                label: "Participant",
            });
            this.wsClient.on("send-rtpCapabilities", this.getRtpCapabilities, this.userId);
            this.wsClient.on("device-rtpCapabilities", this.saveUserRtpCapabilities, this.userId);
            this.wsClient.on("create-transport", this.createTransport, this.userId);
            this.wsClient.on("connect-transport", this.connectTransport, this.userId);
            this.wsClient.on("create-producer", this.createProducer, this.userId);
            this.wsClient.on("create-consumer", this.createConsumer, this.userId);
            this.wsClient.on("send-streams", this.sendStreams, this.userId);
            this.wsClient.on("resume-consumer", this.resumeConsumer, this.userId);
            this.wsClient.on("remove-producer", this.removeProducer, this.userId);
            this.wsClient.on("exit-room", this.exitRoom, this.userId);
            this.wsClient.on("end-call", this.endCall, this.userId);
        };
        this.disableParticipant = () => {
            this.wsClient.off("send-rtpCapabilities", this.getRtpCapabilities, this.userId);
            this.wsClient.off("device-rtpCapabilities", this.saveUserRtpCapabilities, this.userId);
            this.wsClient.off("create-transport", this.createTransport, this.userId);
            this.wsClient.off("connect-transport", this.connectTransport, this.userId);
            this.wsClient.off("create-producer", this.createProducer, this.userId);
            this.wsClient.off("create-consumer", this.createConsumer, this.userId);
            this.wsClient.off("send-streams", this.sendStreams, this.userId);
            this.wsClient.off("resume-consumer", this.resumeConsumer, this.userId);
            this.wsClient.off("remove-producer", this.removeProducer, this.userId);
            this.wsClient.off("exit-room", this.exitRoom, this.userId);
            this.wsClient.off("end-call", this.endCall, this.userId);
        };
        this.userId = userId;
        this.room = room;
        this.wsClient = ws;
        this.username = username;
        this.isHost = isHost;
        logger_1.logger.debug(`Creating new participant ${username} (${userId})`, {
            label: "Participant",
        });
        this.initializeParticipant();
    }
}
exports.Participant = Participant;
