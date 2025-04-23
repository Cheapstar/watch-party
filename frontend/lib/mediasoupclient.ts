import {
  Transport,
  Producer,
  Consumer,
  RtpCapabilities,
  TransportOptions,
} from "mediasoup-client/types";
import { WebSocketClient } from "./websocketClient";
import { Device } from "mediasoup-client";

// this will be given the ws
export class MediasoupClient {
  private device: Device;
  ws: WebSocketClient;
  sendTransport: Transport | null = null;
  recvTransport: Transport | null = null;
  producers: Map<string, Producer> = new Map<string, Producer>();
  consumers: Map<string, Consumer> = new Map<string, Consumer>();

  remoteTracks: Map<string, MediaStreamTrack> = new Map();

  constructor(ws: WebSocketClient) {
    this.ws = ws;
    this.device = new Device();

    this.setUpEventListeners();
  }

  // loading device rtpCapabilities
  private loadRtpCapabilities = async (payload: {
    routerRtpCapabilities: RtpCapabilities;
  }) => {
    if (!this.device) throw new Error("Device is not initialized");
    const { routerRtpCapabilities } = payload;

    await this.device.load({ routerRtpCapabilities });

    // sending request for creating the sendtransport
    this.ws.send("createTransport", {
      direction: "send",
    });
    this.ws.send("createTransport", {
      direction: "recv",
    });
  };

  // creating the sendTransport
  private createTransport = async (payload: {
    transportInfo: TransportOptions;
    direction: Direction;
  }) => {
    if (!this.device) throw new Error("Device is not initialized");

    const { transportInfo, direction } = payload;

    if (direction === "send") {
      this.sendTransport = this.device.createSendTransport(transportInfo);

      console.log(
        "Creating the send Transport with TransportInfo:",
        transportInfo
      );

      this.sendTransport.on("connect", async ({ dtlsParameters }, callback) => {
        this.ws.send("connect-transport", {
          transportId: transportInfo.id,
          dtlsParameters,
          direction: "send",
        });
        callback();
      });

      this.sendTransport.on(
        "produce",
        async ({ kind, rtpParameters }, callback) => {
          this.ws.send("create-producer", {
            kind,
            rtpParameters,
          });

          this.ws.on("producer-created", (payload) => {
            const { producerId } = payload as { producerId: string };
            callback({ id: producerId });
          });
        }
      );
    }

    if (direction === "recv") {
      this.recvTransport = this.device.createRecvTransport(transportInfo);

      console.log(
        "Creating the Recv Transport with TransportInfo:",
        transportInfo
      );

      this.recvTransport.on("connect", async ({ dtlsParameters }, callback) => {
        this.ws.send("connect-transport", {
          transportId: transportInfo.id,
          dtlsParameters,
          direction: "recv",
        });
        callback();
      });

      // this.ws.send("send-streams", {
      //   rtpCapabilities: this.device.rtpCapabilities,
      // });
    }
  };

  createVideoProducer = async (mediaStream: MediaStream) => {
    const producer = (await this.sendTransport?.produce({
      track: mediaStream.getVideoTracks()[0],
    })) as Producer;

    this.producers.set(producer.id, producer);

    producer.on("transportclose", () => {
      console.log("Producer transport closed");
      this.producers.delete(producer.id);
    });
  };
  createAudioProducer = async (mediaStream: MediaStream) => {
    const producer = (await this.sendTransport?.produce({
      track: mediaStream.getAudioTracks()[0],
    })) as Producer;

    this.producers.set(producer.id, producer);

    producer.on("transportclose", () => {
      console.log("Producer transport closed");
      this.producers.delete(producer.id);
    });
  };

  // // consume
  // private consumeTracks = async (consumerOptions: ConsumerOptions) => {
  //   if (!this.recvTransport)
  //     throw new Error("Receive Transport is not Availble");

  //   if (this.consumers.has(consumerOptions.id as string)) return;

  //   console.log("Consuming the Track");

  //   const consumer = await this.recvTransport.consume(consumerOptions);
  //   this.consumers.set(consumer.id, consumer);

  //   this.remoteTracks.set(consumerOptions.id as string, consumer.track);

  //   console.log("Here is the track", consumer.track);
  //   this.ws.send("resumeConsumer", {
  //     consumerId: consumer.id,
  //   });
  // };

  // private produceTrack = async () => {
  //   if (!this.sendTransport) throw new Error("Transport not available");

  //   console.log("Producing the Track");
  //   const tracks = await navigator.mediaDevices.getUserMedia({
  //     video: true,
  //     audio: true,
  //   });
  //   const producer = await this.sendTransport.produce({
  //     track: tracks.getVideoTracks()[0],
  //   });

  //   this.producers.set(producer.id, producer);

  //   producer.on("transportclose", () => {
  //     console.log("Producer transport closed");
  //     this.producers.delete(producer.id);
  //   });
  // };

  // private disconnect = ({
  //   consumerId,
  //   producerId,
  // }: {
  //   consumerId: string;
  //   producerId: string;
  // }) => {
  //   this.sendTransport?.close();
  //   this.recvTransport?.close();
  //   this.producers.get(producerId)?.close();
  //   this.consumers.get(consumerId)?.close();
  // };

  // private removeConsumer = ({ producerId }: { producerId: string }) => {
  //   console.log("REMOVING THE CONSUMER WITH ID:", producerId);

  //   let disconnectedConsumerId: string = "";

  //   for (const [key, consumer] of this.consumers) {
  //     if (consumer.producerId === producerId) {
  //       disconnectedConsumerId = consumer.id;
  //       break;
  //     }
  //   }

  //   this.consumers.get(disconnectedConsumerId)?.close();
  //   this.consumers.delete(disconnectedConsumerId);
  //   this.remoteTracks.delete(disconnectedConsumerId);
  // };

  // getTracks = () => {
  //   return this.remoteTracks;
  // };

  // Setting up the event Listeners for the mediaSoupClient
  private setUpEventListeners = () => {
    this.ws.on("rtpCapabilities", this.loadRtpCapabilities);

    this.ws.on("transport-created", this.createTransport);
    // this.ws.on("newConsumer", this.consumeTracks);

    // this.ws.on("videoCallDisconnected", this.disconnect);
    // this.ws.on("removeConsumer", this.removeConsumer);
  };
}

type Direction = "send" | "recv";
