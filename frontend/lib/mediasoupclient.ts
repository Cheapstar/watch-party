import {
  Transport,
  Producer,
  Consumer,
  RtpCapabilities,
  TransportOptions,
  ConsumerOptions,
} from "mediasoup-client/types";
import { WebSocketClient } from "./websocketClient";
import { Device } from "mediasoup-client";
import {
  ExitParticipantDetails,
  NewParticipantDetails,
  RemoteMedia,
  UserDetails,
} from "@/types";

// this will be given the ws
export class MediasoupClient {
  private device: Device;
  userId: string;
  ws: WebSocketClient;
  sendTransport: Transport | null = null;
  recvTransport: Transport | null = null;
  producers: Map<ProducerType, Producer> = new Map<ProducerType, Producer>();
  consumers: Map<string, ConsumerRecords> = new Map<string, ConsumerRecords>();

  remoteTracks: Map<string, RemoteMedia> = new Map();

  constructor(ws: WebSocketClient, userId: string) {
    this.ws = ws;
    this.device = new Device();
    this.userId = userId;
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
    console.log("Sending Request for transports");

    this.ws.send("device-rtpCapabilities", {
      rtpCapabilities: this.getDeviceRtpCapabilities(),
    });

    this.ws.send("create-transport", {
      direction: "send",
    });
    this.ws.send("create-transport", {
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
        async ({ kind, rtpParameters, appData }, callback) => {
          this.ws.send("create-producer", {
            kind,
            rtpParameters,
            producerData: appData,
          });

          this.ws.on("producer-created", (payload) => {
            const { producerId } = payload as { producerId: string };
            callback({ id: producerId });
          });
        }
      );

      console.log("Send Transport Created Successfully");
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

      console.log("Recv Transport Created Successfully");
      console.log("Sending the Request for the streams");

      this.ws.send("send-streams", {
        rtpCapabilities: this.device.rtpCapabilities,
      });
    }
  };

  createVideoProducer = async (
    mediaStream: MediaStream,
    producerType: "camera" | "screen"
  ) => {
    const videoTracks = mediaStream.getVideoTracks();

    if (videoTracks.length === 0) {
      console.error(`No audio tracks found for ${producerType}`);
      return;
    }

    const producer = (await this.sendTransport?.produce({
      track: mediaStream.getVideoTracks()[0],
      appData: { type: producerType, producerUserId: this.userId }, // Store metadata in appData
    })) as Producer;

    /* Reasoning behind setting producerType as Key is that 
      we can only send four types "camera" | "microphone" | "screen" | "screen-audio"
    */
    this.producers.set(producerType, producer);

    producer.on("transportclose", () => {
      console.log("Producer transport closed");
      this.producers.delete(producerType);
    });

    console.log("Creating the Video Producer");
  };

  createAudioProducer = async (
    mediaStream: MediaStream,
    producerType: "microphone" | "screen-audio"
  ) => {
    const audioTracks = mediaStream.getAudioTracks();

    if (audioTracks.length === 0) {
      console.log(`No audio tracks found for ${producerType}`);
      return;
    }

    const producer = (await this.sendTransport?.produce({
      track: mediaStream.getAudioTracks()[0],
      appData: { type: producerType, producerUserId: this.userId }, // Store metadata in appData
    })) as Producer;

    this.producers.set(producerType, producer);

    producer.on("transportclose", () => {
      console.log("Producer transport closed");
      this.producers.delete(producerType);
    });

    console.log("Creating the Audio Producer");
  };

  getDeviceRtpCapabilities = () => {
    if (!this.device) {
      console.log("Device is not initialized");

      throw new Error(
        "Device is not initialized, can't retrieve the rtpCapabilities"
      );
    }

    return this.device.rtpCapabilities;
  };

  // consume
  createConsumer = async (payload: { consumerOptions: ConsumerOptions }) => {
    if (!this.recvTransport)
      throw new Error("Receive Transport is not Availble");

    const { consumerOptions } = payload;

    if (this.consumers.has(consumerOptions.id as string)) return;

    console.log("Consuming the Track");

    const consumer = await this.recvTransport.consume(consumerOptions);

    const consumerAppData: ConsumerAppData =
      consumerOptions.appData as ConsumerAppData;

    if (this.consumers.has(consumerAppData.producerUserId)) {
      const consumerRecord = this.consumers.get(
        consumerAppData.producerUserId
      ) as ConsumerRecords;

      if (consumerAppData.type === "camera") {
        consumerRecord.cameraConsumer = consumer;
      } else if (consumerAppData.type === "microphone") {
        consumerRecord.microphoneConsumer = consumer;
      } else if (consumerAppData.type === "screen") {
        consumerRecord.screenConsumer = consumer;
      } else {
        consumerRecord.screenAudioConsumer = consumer;
      }

      this.consumers.set(consumerRecord.from, consumerRecord);
    } else {
      const consumerRecord: ConsumerRecords = {
        from: consumerAppData.producerUserId,
      };

      if (consumerAppData.type === "camera") {
        consumerRecord.cameraConsumer = consumer;
      } else if (consumerAppData.type === "microphone") {
        consumerRecord.microphoneConsumer = consumer;
      } else if (consumerAppData.type === "screen") {
        consumerRecord.screenConsumer = consumer;
      } else {
        consumerRecord.screenAudioConsumer = consumer;
      }

      console.log("Setting up the consumer", consumerRecord.from);
      this.consumers.set(consumerRecord.from, consumerRecord);
    }

    this.setTrack(consumerAppData, consumer.track);

    console.log("Here is the track", consumer.track);
    this.ws.send("resume-consumer", {
      consumerId: consumer.id,
    });

    // Emit an event that UI can listen to
    const event = new CustomEvent("new-remote-track");
    window.dispatchEvent(event);
  };

  setTrack = (consumerAppData: ConsumerAppData, track: MediaStreamTrack) => {
    const { producerUserId, type, producerUsername } = consumerAppData;

    /* Check if user alreay exists or not  */
    if (this.remoteTracks.has(producerUserId)) {
      const remoteUserMedia = this.remoteTracks.get(
        producerUserId
      ) as RemoteMedia;

      if (type === "camera") {
        remoteUserMedia.camera = track;
      } else if (type === "microphone") {
        remoteUserMedia.microphone = track;
      } else if (type === "screen") {
        remoteUserMedia.screen = track;
      } else {
        remoteUserMedia.screenAudio = track;
      }

      this.remoteTracks.set(producerUserId, remoteUserMedia);
      return;
    }

    const remoteUserMedia: RemoteMedia = {
      from: producerUserId,
      fromusername: producerUsername,
      camera: undefined,
      screen: undefined,
      microphone: undefined,
      screenAudio: undefined,
    };

    if (type === "camera") {
      remoteUserMedia.camera = track;
    } else if (type === "microphone") {
      remoteUserMedia.microphone = track;
    } else if (type === "screen") {
      remoteUserMedia.screen = track;
    } else {
      remoteUserMedia.screenAudio = track;
    }

    this.remoteTracks.set(producerUserId, remoteUserMedia);
    return;
  };

  handleNewProducer = (payload: {
    producerId: string;
    producerUserId: string;
    kind: string;
    producerType: string;
    producerUsername: string;
  }) => {
    const { producerId, producerUserId, kind, producerType, producerUsername } =
      payload;

    console.log(`New ${producerType} available from user ${producerUserId}`);

    /*
      Here We Can handle something like invite or allow
    */

    // Request to consume this producer
    this.ws.send("create-consumer", {
      producerId,
      rtpCapabilities: this.device.rtpCapabilities,
      kind,
      producerType,
      producerUserId,
      producerUsername,
    });
  };

  closeMediaProducer = (type: ProducerType) => {
    const producer = this.producers.get(type);

    if (producer) {
      this.ws.send("remove-producer", {
        producerId: producer.id,
        type: type,
      });
      producer.close();
      this.producers.delete(type);
    }
  };

  closeAllProducers = () => {
    // Close all producers
    this.producers.forEach((producer, type) => {
      producer.close();
      this.ws.send("remove-producer", {
        producerId: producer.id,
        type: type,
      });
    });
    this.producers.clear();
  };

  removeConsumer = (payload: { producerUserId: string; type: string }) => {
    console.log("Before Removing the tracks", this.remoteTracks);

    const { producerUserId, type } = payload;

    const removingConsumer = this.consumers.get(producerUserId);
    const remoteTrack = this.remoteTracks.get(producerUserId) as RemoteMedia;

    if (!removingConsumer) return;

    /*
      1. Delete the track 
      2. Check if there is anymore track , if no then delete it
    */

    if (type === "camera") {
      removingConsumer.cameraConsumer = undefined;
      remoteTrack.camera = undefined;
    } else if (type === "microphone") {
      removingConsumer.microphoneConsumer = undefined;
      remoteTrack.microphone = undefined;
    } else if (type === "screen") {
      removingConsumer.screenConsumer = undefined;
      remoteTrack.screen = undefined;
    } else {
      removingConsumer.screenAudioConsumer = undefined;
      remoteTrack.screenAudio = undefined;
    }

    if (
      !removingConsumer.cameraConsumer &&
      !removingConsumer.screenConsumer &&
      !removingConsumer.microphoneConsumer &&
      !removingConsumer.screenAudioConsumer
    ) {
      this.consumers.delete(producerUserId);
      this.remoteTracks.delete(producerUserId);
    } else {
      this.consumers.set(producerUserId, removingConsumer);
      this.remoteTracks.set(producerUserId, remoteTrack);
    }

    console.log("After Removing the Track", this.remoteTracks);
    const event = new CustomEvent("new-remote-track");
    window.dispatchEvent(event);
  };

  newParticipant = (payload: { userDetails: UserDetails }) => {
    const { userId, userName } = payload.userDetails;

    /*
        yaha pe hume set karna hai ye       
        roomParticipantsMap <string ------- UserDetails>
        As the participants joins , recieve data from the server and the update it.
        This can also complete the permission model. maybe?

        iss event ko listen karenge and there we will update the state
    */

    if (this.remoteTracks.has(userId)) {
      const rm = this.remoteTracks.get(userId) as RemoteMedia;
      rm.fromusername = userName;
      this.remoteTracks.set(userId, rm);
      return;
    }

    const newRm: RemoteMedia = {
      from: userId,
      fromusername: userName,
    };

    this.remoteTracks.set(userId, newRm);

    // Emit an event that UI can listen to
    const event = new CustomEvent<NewParticipantDetails>("new-participant", {
      detail: {
        userDetails: payload.userDetails,
      },
    });
    window.dispatchEvent(event);
  };

  handleOtherUserExit = (payload: { exitedUserId: string }) => {
    const { exitedUserId } = payload;

    const removedConsumerTracks = this.remoteTracks.get(exitedUserId);
    this.remoteTracks.delete(exitedUserId);

    const trackUpdateEvent = new CustomEvent("new-remote-track");
    window.dispatchEvent(trackUpdateEvent);

    const userExitEvent = new CustomEvent<ExitParticipantDetails>(
      "user-exit-room",
      {
        detail: {
          userId: exitedUserId,
        },
      }
    );
    window.dispatchEvent(userExitEvent);

    if (!removedConsumerTracks) return;

    const removedConsumerRecord = this.consumers.get(exitedUserId);
    if (!removedConsumerRecord) return;

    if (removedConsumerRecord.cameraConsumer)
      removedConsumerRecord.cameraConsumer.close();
    if (removedConsumerRecord.microphoneConsumer)
      removedConsumerRecord.microphoneConsumer.close();
    if (removedConsumerRecord.screenConsumer)
      removedConsumerRecord.screenConsumer.close();
    if (removedConsumerRecord.screenAudioConsumer)
      removedConsumerRecord.screenAudioConsumer.close();
    this.consumers.delete(exitedUserId);
  };

  closeAllConsumers = () => {
    // Close all consumers
    this.consumers.forEach((consumerRecord) => {
      if (consumerRecord.cameraConsumer) consumerRecord.cameraConsumer.close();
      if (consumerRecord.microphoneConsumer)
        consumerRecord.microphoneConsumer.close();
      if (consumerRecord.screenConsumer) consumerRecord.screenConsumer.close();
      if (consumerRecord.screenAudioConsumer)
        consumerRecord.screenAudioConsumer.close();
    });
    this.consumers.clear();
  };

  handleEndCall = (payload: { message: string }) => {
    console.log("Call ended:", payload.message);

    this.closeAllProducers();

    this.closeAllConsumers();

    // Close transports
    if (this.sendTransport) {
      this.sendTransport.close();
      this.sendTransport = null;
    }

    if (this.recvTransport) {
      this.recvTransport.close();
      this.recvTransport = null;
    }

    // Clear all remote tracks
    this.remoteTracks.clear();

    // Reset device
    this.device = new Device();

    // Dispatch event to notify UI
    const event = new CustomEvent("call-ended");
    window.dispatchEvent(event);
  };

  // Setting up the event Listeners for the mediaSoupClient
  private setUpEventListeners = () => {
    this.ws.on("rtpCapabilities", this.loadRtpCapabilities);

    this.ws.on("transport-created", this.createTransport);
    this.ws.on("new-consumer", this.createConsumer);
    this.ws.on("new-producer-available", this.handleNewProducer); // Add this line
    this.ws.on("remove-consumer", this.removeConsumer);
    this.ws.on("new-participant", this.newParticipant);
    this.ws.on("user-exited-room", this.handleOtherUserExit);
    this.ws.on("call-ended", this.handleEndCall);

    // this.ws.on("videoCallDisconnected", this.disconnect);
    // this.ws.on("removeConsumer", this.removeConsumer);
  };
}

type Direction = "send" | "recv";

/*
  storage of remote Media Tracks
  
  each user can only send 4 types of media track
  1. "camera"
  2. "microphone"
  3. "screen"
  4. "screen-audio"


  we will store remoteTracks as per other participants Id
*/

type ConsumerAppData = {
  type: string;
  producerUserId: string;
  producerUsername: string;
};

export type ConsumerRecords = {
  from: string;
  cameraConsumer?: Consumer;
  microphoneConsumer?: Consumer;
  screenConsumer?: Consumer;
  screenAudioConsumer?: Consumer;
};

type ProducerType = "camera" | "screen" | "microphone" | "screen-audio";
