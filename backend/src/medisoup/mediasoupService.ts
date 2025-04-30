import { mediasoupConfig } from "./config/mediasoup.config";
import { Worker } from "mediasoup/node/lib/WorkerTypes";
import * as mediasoup from "mediasoup";
import { Router } from "mediasoup/node/lib/types";
import { logger } from "../utils/logger";

export class MediaSoupService {
  private worker?: Worker;
  public routers: Map<string, Router> = new Map();

  constructor() {}

  createWorker = async () => {
    try {
      const newWorker = await mediasoup.createWorker(mediasoupConfig.worker);
      logger.info("MediaSoup Worker is successfully created");

      // subscribing to the died event
      newWorker.on("died", () => {
        logger.error(
          "Mediasoup worker died, exiting in 2 seconds.... [pid%id]",
          newWorker.pid
        );
        setTimeout(() => process.exit(1), 2000);
      });

      this.worker = newWorker;
    } catch (error) {
      logger.error("Could not create the worker", error);
      throw error;
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

      logger.info("Mediasoup Router has been created succeffully");
      this.routers.set(roomId, router);

      return router;
    } catch (error) {
      logger.error(
        `Error while creating the router for the team with teamId:${roomId}`,
        error
      );

      throw error;
    }
  };
}
