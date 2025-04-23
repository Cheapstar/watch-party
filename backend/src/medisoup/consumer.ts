import { Consumer } from "mediasoup/node/lib/ConsumerTypes";
import { RtpCapabilities } from "mediasoup/node/lib/rtpParametersTypes";
import { getRouter } from "./router";
import { getRecvTransport } from "./transports";
import { WebRtcServer, WebRtcTransport } from "mediasoup/node/lib/types";

const CONSUMERS = new Map<string, Map<string, Consumer[]>>();

export async function createConsumer(
  roomId: string,
  userId: string,
  producerId: string,
  rtpCaps: RtpCapabilities
) {
  const router = getRouter(roomId);
  const recvTransport = getRecvTransport(roomId, userId) as WebRtcTransport;
  try {
    if (!router?.canConsume({ producerId, rtpCapabilities: rtpCaps })) {
      throw new Error(`Cannot Consumer this producer`);
    }

    const consumer = await recvTransport.consume({
      producerId,
      rtpCapabilities: rtpCaps,
      paused: true,
    });

    consumer.on("transportclose", () => {
      CONSUMERS.get(roomId)
        ?.get(userId)
        ?.find((c) => c.id === consumer.id)
        ?.close();
    });

    ensureConsumerExists(roomId);

    CONSUMERS.get(roomId)?.get(userId)?.push(consumer);
  } catch (error) {
    console.log(
      `Consumer could not be created for the given user with userId:${userId} does not exist in the room with roomId:${roomId}`
    );

    throw new Error(
      `Consumer could not be created for the given user with userId:${userId} does not exist in the room with roomId:${roomId}`
    );
  }
}

function ensureConsumerExists(roomId: string) {
  if (CONSUMERS.has(roomId)) return;

  CONSUMERS.set(roomId, new Map<string, Consumer[]>());
}
