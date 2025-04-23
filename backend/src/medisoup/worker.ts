import { Worker } from "mediasoup/node/lib/types";
import mediasoup from "mediasoup";
import { mediasoupConfig } from "./config/mediasoup.config";

let worker: Worker;

export async function createWorker() {
  try {
    const newWorker = await mediasoup.createWorker(mediasoupConfig.worker);

    // subscribing to the dead event
    newWorker.on("died", () => {
      console.log(
        "Worker died with,exiting in 2 second with [pid%id]",
        newWorker.pid
      );
    });

    worker = newWorker;
  } catch (error) {
    console.log("Error occured while creating the mediasoup worker");

    throw new Error("Couldn't create the worker , please check");
  }
}

export function getWorker() {
  ensureWorkerExists();

  return worker;
}

export function closeWorker() {
  try {
    worker.close();
  } catch (error) {
    console.log("Error Occured while closing the worker");
  }
}

function ensureWorkerExists() {
  if (worker) return;

  console.log(`Worker Does not exists,Restart the server`);

  throw new Error(`Worker Does not exists,Restart the server`);
}
