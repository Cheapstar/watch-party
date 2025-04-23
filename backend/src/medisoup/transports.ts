import mediasoup from "mediasoup";
import { Router } from "mediasoup/node/lib/RouterTypes";
import {
  DtlsParameters,
  WebRtcTransport,
} from "mediasoup/node/lib/WebRtcTransportTypes";
import { getRouter } from "./router";
import { mediasoupConfig } from "./config/mediasoup.config";

/*
    mapping between roomId ----- (userId ------ WebRtcTransport)
    room k hisab se transports store karte hai 
    easier for broadcasting ????
    */

const SENDTRANSPORTS = new Map<string, Map<string, WebRtcTransport>>();
const RECVTRANSPORTS = new Map<string, Map<string, WebRtcTransport>>();

export async function createSendTransport(roomId: string, userId: string) {
  const router = getRouter(roomId) as Router;
  try {
    const sendTransport = await router.createWebRtcTransport(
      mediasoupConfig.webRtcTransport
    );

    // userId ---- transport
    // First check if the map exists or not
    // if exists => room has already been initialised and participants are already there
    ensureRoomExists(roomId, "s");

    SENDTRANSPORTS.get(roomId)?.set(userId, sendTransport);

    return {
      id: sendTransport.id,
      iceCandidates: sendTransport.iceCandidates,
      iceParameters: sendTransport.iceParameters,
      dtlsParameters: sendTransport.dtlsParameters,
    };
  } catch (error) {
    console.log(
      `Error Occured While creating the send Transport for the user with userId:${userId} in the room with roomId:${roomId}`
    );
    throw new Error(
      `Error Occured While creating the send Transport for the user with userId:${userId} in the room with roomId:${roomId}`
    );
  }
}

export async function connectSendTransport(
  roomId: string,
  userId: string,
  dtlsParameters: DtlsParameters
) {
  ensureSendTransportInitialized(roomId, userId);
  try {
    const sendTransport = SENDTRANSPORTS.get(roomId)?.get(
      userId
    ) as WebRtcTransport;

    await sendTransport.connect({ dtlsParameters });

    return sendTransport.id;
  } catch (error) {
    console.log(
      `Could not connect send Transport for the user with userId:${userId} inside room with roomId:${roomId}`
    );
    throw new Error(
      `Could not connect send Transport for the user with userId:${userId} inside room with roomId:${roomId}`
    );
  }
}

function ensureSendTransportInitialized(roomId: string, userId: string) {
  if (SENDTRANSPORTS.has(roomId)) {
    return SENDTRANSPORTS.get(roomId)?.has(userId);
  }

  console.log(
    `Send Transport for the user with userId:${userId}, in the room ${roomId} does not exists`
  );

  throw new Error(
    `Send Transport for the user with userId:${userId}, in the room ${roomId} does not exists`
  );
}
export async function createRecvTransport(roomId: string, userId: string) {
  const router = getRouter(roomId) as Router;
  try {
    const recvTransport = await router.createWebRtcTransport(
      mediasoupConfig.webRtcTransport
    );

    // userId ---- transport
    // First check if the map exists or not
    // if exists => room has already been initialised and participants are already there
    ensureRoomExists(roomId, "r");

    RECVTRANSPORTS.get(roomId)?.set(userId, recvTransport);

    return {
      id: recvTransport.id,
      iceCandidates: recvTransport.iceCandidates,
      iceParameters: recvTransport.iceParameters,
      dtlsParameters: recvTransport.dtlsParameters,
    };
  } catch (error) {
    console.log(
      `Error Occured While creating the send Transport for the user with userId:${userId} in the room with roomId:${roomId}`
    );
    throw new Error(
      `Error Occured While creating the send Transport for the user with userId:${userId} in the room with roomId:${roomId}`
    );
  }
}

export async function connectRecvTransport(
  roomId: string,
  userId: string,
  dtlsParameters: DtlsParameters
) {
  ensureRecvTransportInitialized(roomId, userId);
  try {
    const recvTransport = RECVTRANSPORTS.get(roomId)?.get(
      userId
    ) as WebRtcTransport;

    await recvTransport.connect({ dtlsParameters });

    return recvTransport.id;
  } catch (error) {
    console.log(
      `Could not connect send Transport for the user with userId:${userId} inside room with roomId:${roomId}`
    );
    throw new Error(
      `Could not connect send Transport for the user with userId:${userId} inside room with roomId:${roomId}`
    );
  }
}

function ensureRecvTransportInitialized(roomId: string, userId: string) {
  if (RECVTRANSPORTS.has(roomId)) {
    return RECVTRANSPORTS.get(roomId)?.has(userId);
  }

  console.log(
    `Recv Transport for the user with userId:${userId}, in the room ${roomId} does not exists`
  );

  throw new Error(
    `Recv Transport for the user with userId:${userId}, in the room ${roomId} does not exists`
  );
}

function ensureRoomExists(roomId: string, marker: string) {
  if (marker === "s") {
    if (SENDTRANSPORTS.has(roomId)) return;

    SENDTRANSPORTS.set(roomId, new Map<string, WebRtcTransport>());

    return;
  }

  if (marker === "r") {
    if (RECVTRANSPORTS.has(roomId)) return;

    RECVTRANSPORTS.set(roomId, new Map<string, WebRtcTransport>());
    return;
  }
}

export function getSendTransport(roomId: string, userId: string) {
  ensureSendTransportInitialized(roomId, userId);

  return SENDTRANSPORTS.get(roomId)?.get(userId);
}

export function getRecvTransport(roomId: string, userId: string) {
  ensureRecvTransportInitialized(roomId, userId);

  return RECVTRANSPORTS.get(roomId)?.get(userId);
}
