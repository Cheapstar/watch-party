import {
  MediaKind,
  Producer,
  RtpParameters,
  WebRtcTransport,
} from "mediasoup/node/lib/types";
import { getSendTransport } from "./transports";

const PRODUCERS = new Map<string, Map<string, Producer[]>>();

export async function createProducer(
  roomId: string,
  userId: string,
  kind: MediaKind,
  rtpParams: RtpParameters
) {
  const sendTransport = getSendTransport(roomId, userId) as WebRtcTransport;

  try {
    const producer = await sendTransport.produce({
      kind,
      rtpParameters: rtpParams,
    });

    ensureRoomExists(roomId);

    PRODUCERS.get(roomId)?.get(userId)?.push(producer);

    return producer.id;
  } catch (error) {
    console.log(
      `Producer could not be created for the given user with userId:${userId} does not exist in the room with roomId:${roomId}`
    );

    throw new Error(
      `Producer could not be created for the given user with userId:${userId} does not exist in the room with roomId:${roomId}`
    );
  }
}

function ensureRoomExists(roomId: string) {
  if (PRODUCERS.has(roomId)) return;

  PRODUCERS.set(roomId, new Map<string, Producer[]>());
}
