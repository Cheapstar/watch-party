import { mediasoupConfig } from "./config/mediasoup.config";
import { Worker } from "mediasoup/node/lib/WorkerTypes";
import mediasoup from "mediasoup";
import { Router } from "mediasoup/node/lib/types";

export class MediaSoupService {
  private worker?: Worker;
  public routers: Map<string, Router> = new Map();

  constructor() {}

  createWorker = async () => {
    try {
      const newWorker = await mediasoup.createWorker(mediasoupConfig.worker);

      // subscribing to the died event
      newWorker.on("died", () => {
        console.log(
          "Mediasoup worker died, exiting in 2 seconds.... [pid%id]",
          newWorker.pid
        );
        setTimeout(() => process.exit(1), 2000);
      });

      this.worker = newWorker;
    } catch (error) {
      if (error instanceof Error) {
        console.log("Couldn't create the mediasoup worker", error);
      }
      throw new Error("Couldn't create the mediasoup worker");
    }
  };

  createRouter = async ({ roomId }: { roomId: string }) => {
    try {
      if (!this.worker) {
        throw new Error("Worker not initialized");
      }

      const router = await this.worker.createRouter({
        mediaCodecs: mediasoupConfig.router.mediaCodecs,
      });

      this.routers.set(roomId, router);

      return router;
    } catch (error) {
      console.log(
        `Error while creating the router for the team with teamId:${roomId}`,
        error
      );

      throw new Error("Couldn't create the Router");
    }
  };
}
