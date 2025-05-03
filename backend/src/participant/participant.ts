import { Room } from "../rooms/room.js";
import { WebSocketClient } from "../websocket/websocketclient.js";
import { mediasoupConfig } from "../medisoup/config/mediasoup.config.js";
import { logger } from "../utils/logger.js";
import {
  Consumer,
  Producer,
  RtpCapabilities,
  WebRtcTransport,
} from "mediasoup/types";
import { MessageType } from "../LiveChat/types.js";

export class Participant {
  public sendTransport?: WebRtcTransport;
  public recvTransport?: WebRtcTransport;
  public producer: Map<string, Producer> = new Map();
  public consumer: Map<string, Consumer> = new Map();
  public rtpCapabilities?: RtpCapabilities;
  public readonly userId: string;
  public readonly username: string;
  private readonly room: Room;
  private readonly wsClient: WebSocketClient;
  private readonly isHost: boolean;

  constructor(
    userId: string,
    room: Room,
    ws: WebSocketClient,
    username: string,
    isHost: boolean
  ) {
    this.userId = userId;
    this.room = room;
    this.wsClient = ws;
    this.username = username;
    this.isHost = isHost;

    logger.debug(`Creating new participant ${username} (${userId})`, {
      label: "Participant",
    });
    this.initializeParticipant();
  }

  sendRoomDetails = async ({ userId, payload }: Args) => {
    const roomDetails = await this.room.getDetails();
    this.wsClient.send(this.userId, "roomDetails", {
      roomDetails: roomDetails,
    });
  };

  getRtpCapabilities = ({ userId, payload }: Args) => {
    logger.info(`Request for RTP capabilities from user ${userId}`, {
      label: "Participant",
    });

    this.wsClient.send(userId, "rtpCapabilities", {
      routerRtpCapabilities: this.room.getRouter().rtpCapabilities,
    });
  };

  saveUserRtpCapabilities = ({ userId, payload }: Args) => {
    const { rtpCapabilities } = payload;

    if (!rtpCapabilities) {
      logger.warn(`No RTP capabilities provided by user ${userId}`, {
        label: "Participant",
      });
      return;
    }

    /* Saving the Client's Rtp Capabilities to reduce extra overhead */
    this.rtpCapabilities = rtpCapabilities;
    logger.debug(`Saved RTP capabilities for user ${userId}`, {
      label: "Participant",
    });
  };

  createTransport = async ({ userId, payload }: Args) => {
    const router = this.room.getRouter();
    try {
      const { direction } = payload;

      if (!direction || (direction !== "recv" && direction !== "send")) {
        logger.error(`Invalid transport direction: ${direction}`, {
          label: "Participant",
        });
        throw new Error("Invalid transport direction");
      }

      logger.debug(`Creating ${direction} transport for user ${userId}`, {
        label: "Participant",
      });

      const transport: WebRtcTransport = await router.createWebRtcTransport(
        mediasoupConfig.webRtcTransport
      );

      if (direction === "recv") {
        this.recvTransport = transport;
      } else {
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

      logger.info(
        `Transport ${direction} created successfully for user ${userId}`,
        {
          label: "Participant",
          transportId: transport.id,
        }
      );
    } catch (error) {
      logger.error(
        `Error creating ${payload.direction} transport for user ${userId}: ${error}`,
        {
          label: "Participant",
          error,
        }
      );

      const message = `Error while creating the ${payload.direction} transport`;
      this.wsClient.send(userId, "error", {
        code: `${(
          payload.direction as string
        ).toUpperCase()}_TRANSPORT_CREATE_FAILED`,
        message,
      });
    }
  };

  connectTransport = async ({ userId, payload }: Args) => {
    try {
      const { direction, dtlsParameters } = payload;
      this.ensureTransportInitialized(direction);

      const transport = this.getTransport(
        direction as Direction
      ) as WebRtcTransport;
      transport?.connect({ dtlsParameters });

      this.wsClient.send(userId, "transport-connected", {
        transportId: transport.id,
        direction,
      });

      logger.info(`Transport ${transport.id} connected for user ${userId}`, {
        label: "Participant",
        direction,
      });
    } catch (error) {
      logger.error(
        `Error connecting ${payload.direction} transport for user ${userId}: ${error}`,
        {
          label: "Participant",
          error,
        }
      );

      const message = `Error while connecting with the ${payload.direction} transport`;
      this.wsClient.send(userId, "error", {
        code: `${(
          payload.direction as string
        ).toUpperCase()}_TRANSPORT_CONNECT_FAILED`,
        message,
      });
    }
  };

  createProducer = async ({ userId, payload }: Args) => {
    try {
      this.ensureTransportInitialized("send");

      const { kind, rtpParameters, producerData } = payload;
      const transport = this.sendTransport as WebRtcTransport;

      logger.debug(`Creating producer of kind ${kind} for user ${userId}`, {
        label: "Participant",
        producerData,
      });

      const producer = await transport.produce({
        kind,
        rtpParameters,
        appData: { ...producerData },
      });

      this.producer.set(producer.id, producer);

      // this is for broadcasting
      this.broadcastNewProducer(producer, producerData.type);

      this.wsClient.send(userId, "producer-created", {
        producerId: producer.id,
      });

      producer.on("transportclose", () => {
        logger.info(`Producer ${producer.id} transport closed`, {
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
        logger.info(`Producer ${producer.id} closed`, {
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

      logger.info(`New ${kind} producer created for user ${userId}`, {
        label: "Participant",
        producerId: producer.id,
        kind,
      });
    } catch (error) {
      logger.error(`Error creating producer for user ${userId}: ${error}`, {
        label: "Participant",
        error,
      });

      this.wsClient.send(userId, "error", {
        code: "PRODUCE_MEDIA_ERROR",
        message: "Couldn't Producer the Media",
      });
    }
  };

  broadcastNewProducer = (producer: Producer, producerType: string) => {
    logger.debug(
      `Broadcasting new producer ${producer.id} of type ${producerType}`,
      {
        label: "Participant",
        producerId: producer.id,
        producerType,
      }
    );

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

  createConsumer = async ({ userId, payload }: Args) => {
    try {
      const router = this.room.getRouter();
      this.ensureTransportInitialized("recv");

      const {
        producerId,
        rtpCapabilities,
        producerType,
        producerUserId,
        producerUsername,
      } = payload;

      logger.debug(
        `Creating consumer for producer ${producerId} for user ${userId}`,
        {
          label: "Participant",
          producerId,
        }
      );

      // Check if client can consume this producer
      if (!router.canConsume({ producerId, rtpCapabilities })) {
        logger.warn(`User ${userId} cannot consume producer ${producerId}`, {
          label: "Participant",
          producerId,
        });
        throw new Error("Client cannot consume this producer");
      }

      const recvTransport = this.recvTransport as WebRtcTransport;

      const consumer = await recvTransport.consume({
        producerId,
        rtpCapabilities,
        paused: true,
      });

      this.consumer.set(consumer.id, consumer);

      consumer.on("transportclose", () => {
        logger.info(`Consumer ${consumer.id} transport closed`, {
          label: "Participant",
          consumerId: consumer.id,
        });
        this.consumer.delete(consumer.id);
      });

      consumer.on("@close", () => {
        logger.info(`Consumer ${consumer.id} closed`, {
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

      logger.info(`Created new consumer ${consumer.id} for user ${userId}`, {
        label: "Participant",
        consumerId: consumer.id,
        producerId,
      });
    } catch (error) {
      logger.error(`Error creating consumer for user ${userId}: ${error}`, {
        label: "Participant",
        error,
      });

      this.wsClient.send(userId, "error", {
        code: "CREATE_CONSUMER_FAILED",
        message: "Error while creating the consumer",
      });
      throw new Error("Error while creating the consumer");
    }
  };

  resumeConsumer = async ({ userId, payload: { consumerId } }: Args) => {
    try {
      const consumer = this.consumer.get(consumerId);

      if (!consumer) {
        logger.warn(`Consumer ${consumerId} not found for user ${userId}`, {
          label: "Participant",
          consumerId,
        });
        this.wsClient.send(userId, "error", {
          code: "CONSUMER_NOT_FOUND",
          message: "Consumer not found",
        });
        return;
      }

      await consumer.resume();

      this.wsClient.send(userId, "consumer-resumed", {
        consumerId: consumer.id,
      });

      logger.info(`Resumed consumer ${consumer.id} for user ${userId}`, {
        label: "Participant",
        consumerId: consumer.id,
      });
    } catch (error) {
      logger.error(
        `Error resuming consumer ${consumerId} for user ${userId}: ${error}`,
        {
          label: "Participant",
          consumerId,
          error,
        }
      );

      this.wsClient.send(userId, "error", {
        code: "RESUME_CONSUMER_FAILED",
        message: "Failed to resume consumer",
      });
    }
  };

  getTransport = (direction: Direction): WebRtcTransport | undefined => {
    if (direction === "recv") {
      return this.recvTransport;
    }

    if (direction === "send") {
      return this.sendTransport;
    }
  };

  ensureTransportInitialized = (direction: string): void => {
    if (direction === "recv") {
      if (!this.recvTransport) {
        const error = `Recv Transport for user with userId:${this.userId} is not initialized`;
        logger.error(error, { label: "Participant" });
        throw new Error(error);
      }
    }

    if (direction === "send") {
      if (!this.sendTransport) {
        const error = `Send Transport for user with userId:${this.userId} is not initialized`;
        logger.error(error, { label: "Participant" });
        throw new Error(error);
      }
    }
  };

  removeProducer = ({ userId, payload }: Args) => {
    const { producerId, type } = payload;

    logger.info(`Removing producer ${producerId} of type ${type}`, {
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

  sendStreams = async ({ userId, payload }: Args) => {
    const participants = this.room.getOtherParticipants({
      userId: this.userId,
    });

    if (participants.length < 1) {
      logger.debug(
        `No other participants to send streams to for user ${userId}`,
        {
          label: "Participant",
        }
      );
      return;
    }

    const { rtpCapabilities } = payload;

    logger.debug(
      `Sending streams to user ${userId} from ${participants.length} participants`,
      {
        label: "Participant",
      }
    );

    logger.info(`Total Participants Present are ${participants.length}`);
    for (let i = 0; i < participants.length; i++) {
      const participantProducers = Array.from(
        participants[i].producer.values()
      );

      logger.info(
        `Total producer for participant ${i} is ${participantProducers.length}`
      );

      for (let j = 0; j < participantProducers.length; j++) {
        await this.createConsumer({
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
  };

  endCall = async ({ userId, payload }: Args) => {
    if (!this.isHost) {
      this.wsClient.send(userId, "not-allowed", {
        code: "NOT_ALLOWED",
        message: "You don't have permission to execute that operation",
      });
      return;
    }

    logger.info(`Host ${this.userId} is ending the call`, {
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
  };

  exitRoom = async ({ userId, payload }: Args) => {
    logger.info(`Participant ${this.userId} is exiting the room`, {
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
    await this.room.removeParticipant(this.userId);
  };

  handleLoadExternalMedia = async ({ userId, payload }: Args) => {
    const { url } = payload;
    logger.info(`Request for the loading external media: ${url}`);
    logger.info(`Broadcasting the url in the whole room`);
    this.wsClient.broadCastMessage({
      userIds: this.room.getOtherParticipantsUserId({ userId: userId }),
      type: "load-external-media",
      payload: {
        url: url,
      },
    });
    await this.room.saveExternalMedia({ url });
  };

  handleRemoveExternalMedia = async ({ userId, payload }: Args) => {
    logger.info(`Request for removing External Media`);
    this.wsClient.broadCastMessage({
      userIds: this.room.getOtherParticipantsUserId({ userId: userId }),
      type: "unload-external-media",
      payload: "",
    });
    await this.room.removeExternalMedia();
  };

  handleNewChatMessage = async ({ userId, payload }: Args) => {
    try {
      const message = payload.message as MessageType;
      const lcService = this.room.getLiveChat();

      await lcService.saveMessage(message);

      this.wsClient.broadCastMessage({
        userIds: this.room.getOtherParticipantsUserId({ userId }),
        type: "livechat-new-message",
        payload: {
          message,
        },
      });
    } catch (error) {
      throw error;
    }
  };

  handleGetChatMessages = async ({ userId, payload }: Args) => {
    try {
      const lcService = this.room.getLiveChat();
      const result = await lcService.getAllMessages();

      this.wsClient.send(userId, "livechat-load-messages", {
        messages: result,
      });
    } catch (error) {
      throw error;
    }
  };

  close = () => {
    logger.info(`Closing all resources for participant ${this.userId}`, {
      label: "Participant",
    });

    // Close all producers
    this.producer.forEach((producer) => {
      logger.debug(`Closing producer ${producer.id}`, {
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
      logger.debug(`Closing consumer ${consumer.id}`, {
        label: "Participant",
        consumerId: consumer.id,
      });
      consumer.close();
    });
    this.consumer.clear();

    // Close transports
    if (this.sendTransport) {
      logger.debug(`Closing send transport ${this.sendTransport.id}`, {
        label: "Participant",
        transportId: this.sendTransport.id,
      });
      this.sendTransport.close();
      this.sendTransport = undefined;
    }

    if (this.recvTransport) {
      logger.debug(`Closing recv transport ${this.recvTransport.id}`, {
        label: "Participant",
        transportId: this.recvTransport.id,
      });
      this.recvTransport.close();
      this.recvTransport = undefined;
    }

    // Disable all event listeners
    this.disableParticipant();
  };

  private initializeParticipant = () => {
    logger.debug(`Initializing participant ${this.userId}`, {
      label: "Participant",
    });

    this.wsClient.on("get-roomDetails", this.sendRoomDetails, this.userId);
    this.wsClient.on(
      "send-rtpCapabilities",
      this.getRtpCapabilities,
      this.userId
    );

    this.wsClient.on(
      "device-rtpCapabilities",
      this.saveUserRtpCapabilities,
      this.userId
    );
    this.wsClient.on("create-transport", this.createTransport, this.userId);
    this.wsClient.on("connect-transport", this.connectTransport, this.userId);
    this.wsClient.on("create-producer", this.createProducer, this.userId);

    this.wsClient.on("create-consumer", this.createConsumer, this.userId);
    this.wsClient.on("send-streams", this.sendStreams, this.userId);
    this.wsClient.on("resume-consumer", this.resumeConsumer, this.userId);
    this.wsClient.on("remove-producer", this.removeProducer, this.userId);
    this.wsClient.on("exit-room", this.exitRoom, this.userId);
    this.wsClient.on("end-call", this.endCall, this.userId);
    this.wsClient.on(
      "external-media",
      this.handleLoadExternalMedia,
      this.userId
    );
    this.wsClient.on(
      "remove-external-media",
      this.handleRemoveExternalMedia,
      this.userId
    );
    this.wsClient.on(
      "livechat-save-message",
      this.handleNewChatMessage,
      this.userId
    );
    this.wsClient.on(
      "livechat-get-messages",
      this.handleGetChatMessages,
      this.userId
    );

    this.wsClient.send(this.userId, "client-loaded", "");
  };

  private disableParticipant = () => {
    this.wsClient.off(
      "send-rtpCapabilities",
      this.getRtpCapabilities,
      this.userId
    );
    this.wsClient.off(
      "device-rtpCapabilities",
      this.saveUserRtpCapabilities,
      this.userId
    );
    this.wsClient.off("create-transport", this.createTransport, this.userId);
    this.wsClient.off("connect-transport", this.connectTransport, this.userId);
    this.wsClient.off("create-producer", this.createProducer, this.userId);

    this.wsClient.off("create-consumer", this.createConsumer, this.userId);
    this.wsClient.off("send-streams", this.sendStreams, this.userId);
    this.wsClient.off("resume-consumer", this.resumeConsumer, this.userId);

    this.wsClient.off("remove-producer", this.removeProducer, this.userId);
    this.wsClient.off("exit-room", this.exitRoom, this.userId);
    this.wsClient.off("end-call", this.endCall, this.userId);
    this.wsClient.off(
      "external-media",
      this.handleLoadExternalMedia,
      this.userId
    );
    this.wsClient.off(
      "remove-external-media",
      this.handleRemoveExternalMedia,
      this.userId
    );
    this.wsClient.off("get-roomDetails", this.sendRoomDetails, this.userId);
    this.wsClient.off(
      "livechat-save-message",
      this.handleNewChatMessage,
      this.userId
    );
    this.wsClient.off(
      "livechat-get-messages",
      this.handleGetChatMessages,
      this.userId
    );
  };
}

interface Args {
  userId: string;
  payload?: any;
}

type Direction = "recv" | "send";

interface ProducerAppData {
  type: "microphone" | "camera" | "screen";
  producerUserId: string;
}
