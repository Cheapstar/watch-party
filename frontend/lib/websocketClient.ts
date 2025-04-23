/* eslint-disable @typescript-eslint/no-explicit-any */
export class WebSocketClient {
  private socket: WebSocket;
  private handlers: Map<string, handlerFn[]> = new Map();
  private jobQueue: Promise<void> = Promise.resolve();

  constructor(url: string) {
    this.socket = new WebSocket(url);
    this.connect();
  }

  connect() {
    this.socket.onopen = () => {
      console.log("Socket Connection has been Established");
    };

    this.socket.onmessage = (rawData) => {
      const parsedData = JSON.parse(rawData.data);
      const { type, payload } = parsedData;

      console.log("Received Message:", parsedData);

      const nextJob = this.jobQueue.then(async () => {
        const typeHandlers = this.handlers.get(type);
        await Promise.all(
          (typeHandlers as handlerFn[]).map((fn) => fn(payload))
        );
      });

      this.jobQueue = nextJob;

      nextJob.catch((err) => {
        console.log(
          err instanceof Error
            ? err.message
            : "Error Occured While executing the Job"
        );
      });
    };

    this.socket.onclose = () => {
      console.log("Connection has been Closed");
    };

    this.socket.onerror = (error) => {
      console.log(
        "Error has occured while connecting to the websocket server",
        error
      );
    };
  }

  on(type: string, handler: handlerFn) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }

    this.handlers.get(type)?.push(handler);
  }

  off(type: string, handler: handlerFn) {
    if (!this.handlers.has(type)) return;
    const handlers = this.handlers.get(type);
    const index = handlers?.indexOf(handler);
    if (index !== -1) {
      handlers?.splice(index as number, 1);
    }
  }

  send(type: string, payload: unknown) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = {
        type,
        payload,
      };

      this.socket.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connnected");
    }
  }

  close() {
    if (this.socket) {
      this.socket.close();
    }
  }
}

interface handlerFn {
  (payload: any): Promise<void> | void;
}
