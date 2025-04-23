import { Consumer, Producer, RtpCapabilities } from "mediasoup/node/lib/types";
import { WebRtcTransport } from "mediasoup/node/lib/WebRtcTransportTypes";
import { Room } from "../room";
import { WebSocketClient } from "../../websocket/websocketclient";
import { mediasoupConfig } from "../../medisoup/config/mediasoup.config";

export class Participant {
  public sendTransport?: WebRtcTransport;
  public recvTransport?: WebRtcTransport;
  public producer: Map<string, Producer> = new Map();
  public consumer: Map<string, Consumer> = new Map();
  public rtpCapabilities?: RtpCapabilities;
  public userId: string;
  private room: Room;
  private wsClient: WebSocketClient;

  constructor(userId: string, room: Room, ws: WebSocketClient) {
    this.userId = userId;
    this.room = room;
    this.wsClient = ws;
    this.initializeParticipant();
  }

  getRtpCapabilities = ({ userId }: Args) => {
    this.wsClient.send(userId, "rtpCapabilities", {
      rtpCapabilites: this.room.getRouter().rtpCapabilities,
    });
  };

  createTransport = async ({ userId, payload }: Args) => {
    const router = this.room.getRouter();
    try {
      const { direction } = payload;

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

      console.log(`Transport ${userId} created succesfully`);
    } catch (error) {
      console.log(
        `Error while creating the ${payload.direction} transport for the user with userId:${userId}`
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

      this.wsClient.send(userId, "transportConnected", {
        transportId: transport.id,
        direction,
      });
      console.log(`Transport ${userId} connected`);
    } catch (error) {
      console.log(
        `Error while connecting with the ${payload.direction} transport for the user with userId:${userId}`
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
      const router = this.room.getRouter();
      this.ensureTransportInitialized("send");

      const { kind, rtpParameters } = payload;
      const transport = this.sendTransport as WebRtcTransport;

      const producer = await transport.produce({ kind, rtpParameters });

      this.producer.set(producer.id, producer);

      // this is for broadcasting

      this.wsClient.send(userId, "produced", { producerId: producer.id });

      producer.on("transportclose", () => {
        console.log("Producer transport closed so producer closed");
        this.producer.delete(producer.id);
      });

      console.log(
        `New Producer kind ${kind} created successfully for user with userId:${userId}`
      );

      // broadcast this stream to everyone
    } catch (error) {
      console.log("Error while producing the media");
      this.wsClient.send(userId, "error", {
        code: "PRODUCE_MEDIA_ERROR",
        message: "Couldn't Producer the Media",
      });
    }
  };

  // creating the consumer for the user with userId
  createConsumer = async ({ userId, payload }: Args) => {
    try {
      const router = this.room.getRouter();
      this.ensureTransportInitialized("recv");

      const { producerId, rtpCapabilities } = payload;

      // Check if client can consume this producer
      if (!router.canConsume({ producerId, rtpCapabilities })) {
        throw new Error("Client cannot consume this producer");
      }

      const recvTransport = this.recvTransport as WebRtcTransport;

      const consumer = await recvTransport.consume({
        producerId,
        rtpCapabilities,
        paused: true,
      });

      this.consumer?.set(consumer.id, consumer);

      consumer.on("transportclose", () => {
        this.consumer.delete(userId);
      });

      this.wsClient.send(userId, "newConsumer", {
        id: consumer.id,
        producerId: consumer.producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      });
    } catch (error) {
      console.log(
        `Could not create Consumer for the user with userId:${userId}`
      );

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
        this.wsClient.send(userId, "error", {
          code: "CONSUMER_NOT_FOUND",
          message: "Consumer not found",
        });
        return;
      }

      await consumer.resume();
      this.wsClient.send(userId, "consumerResumed", {
        consumerId: consumer.id,
      });
      console.log(`Consumer ${consumer.id} resumed for user ${userId}`);
    } catch (error) {
      console.log(`Error resuming consumer`);
      this.wsClient.send(userId, "error", {
        code: "RESUME_CONSUMER_FAILED",
        message: "Failed to resume consumer",
      });
    }
  };

  getTransport = (direction: Direction) => {
    if (direction === "recv") {
      return this.recvTransport;
    }

    if (direction === "send") {
      return this.sendTransport;
    }
  };

  ensureTransportInitialized = (direction: string) => {
    if (direction === "recv") {
      if (!this.recvTransport) {
        throw new Error(
          `Recv Transport for user with userId:${this.userId} is not initialized`
        );
      }
    }

    if (direction === "send") {
      if (!this.sendTransport) {
        throw new Error(
          `Send Transport for user with userId:${this.userId} is not initialized`
        );
      }
    }
  };

  close = () => {
    this.producer.forEach((p) => p.close());
    this.consumer.forEach((c) => c.close());
    this.sendTransport?.close();
    this.recvTransport?.close();

    this.wsClient.off(
      "send-rtpCapabilities",
      this.getRtpCapabilities,
      this.userId
    );
    this.wsClient.off("create-transport", this.createTransport, this.userId);
    this.wsClient.off("connect-transport", this.connectTransport, this.userId);
    this.wsClient.off("create-producer", this.createProducer, this.userId);
    this.wsClient.off("create-consumer", this.createConsumer, this.userId);
    this.wsClient.off("resumer-consumer", this.resumeConsumer, this.userId);
  };

  initializeParticipant = () => {
    this.wsClient.on(
      "send-rtpCapabilities",
      this.getRtpCapabilities,
      this.userId
    );
    this.wsClient.on("create-transport", this.createTransport, this.userId);
    this.wsClient.on("connect-transport", this.connectTransport, this.userId);
    this.wsClient.on("create-producer", this.createProducer, this.userId);
    this.wsClient.on("create-consumer", this.createConsumer, this.userId);
    this.wsClient.on("resumer-consumer", this.resumeConsumer, this.userId);
  };
}

type Args = {
  userId: string;
  payload?: any;
};

type Direction = "recv" | "send";
