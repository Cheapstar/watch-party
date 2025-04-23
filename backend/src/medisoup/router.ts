import mediasoup from "mediasoup";
import { getWorker } from "./worker";
import { Router } from "mediasoup/node/lib/RouterTypes";
import { mediasoupConfig } from "./config/mediasoup.config";

// Mapping between roomId ----- Router
const ROUTERS = new Map<string, Router>();

export async function createRouter(roomId: string) {
  try {
    const worker = getWorker();
    const newRouter = await worker.createRouter(mediasoupConfig.router);

    ROUTERS.set(roomId, newRouter);
  } catch (error) {
    console.log(
      "Error Occured While creating the router for the room with roomId:%id",
      roomId
    );

    throw new Error(
      `Error Occured While creating the router for the room with roomId:${roomId}`
    );
  }
}

export function getRouter(roomId: string) {
  ensureRouterExists(roomId);

  return ROUTERS.get(roomId);
}

function ensureRouterExists(roomId: string) {
  if (ROUTERS.has(roomId)) return;

  console.log(
    `Router for the given room with roomId:${roomId} does not exists`
  );

  throw new Error(
    `Router for the given room with roomId:${roomId} does not exists`
  );
}
