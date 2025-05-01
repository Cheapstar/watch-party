import WebSocket, { WebSocketServer } from "ws";
export class WebSocketClient {
    constructor(httpServer) {
        this.CLIENTS = new Map(); // userId --- WS
        this.handlers = new Map(); // userId --- (type --- handler)
        this.queues = new Map(); // Per-User-Async-Queue (Just learned)
        this.connect = () => {
            this.wss.on("connection", (ws, req) => {
                console.log("New Connection Established");
                const userId = req.url?.split("=")[1];
                console.log("userId", userId);
                this.registerUser(userId, ws);
                ws.on("message", async (rawData) => {
                    const parsedData = JSON.parse(rawData.toString());
                    // Per-user-async-queue setup
                    /*
                        get the last done job might not be completed
                        if(completed) => immediate execution of the new jon
                        else it will be in queue jab previous ho jayega then exec happen
                     */
                    console.log("recieved Message is", parsedData);
                    const queue = this.queues.get(userId) ?? Promise.resolve();
                    const nextJob = queue.then(async () => {
                        const { type, payload } = parsedData;
                        const userHandlers = this.handlers
                            .get(userId)
                            ?.get(type);
                        if (!userHandlers)
                            return Promise.resolve();
                        await Promise.all(userHandlers.map((fn) => fn({ userId, payload })));
                    });
                    /*
                        Set up the last done job , might not be completed
                    */
                    this.queues.set(userId, nextJob);
                    // Error handling ahhh..
                    nextJob.catch((err) => {
                        console.error("Handler error", err);
                        this.queues.set(userId, Promise.resolve());
                    });
                });
                ws.on("close", () => {
                    console.log("Closing the Server");
                    /*
                        In Here Maybe we can also get up the closer function , registered by each unit
                        jo yaha pe run honge and then making it the completed cleanup
                    */
                });
            });
        };
        // registering the handlers
        this.on = (type, handler, userId) => {
            const userHandlers = this.handlers.get(userId);
            if (!userHandlers?.has(type)) {
                userHandlers?.set(type, []);
            }
            userHandlers?.get(type)?.push(handler);
        };
        // removing the handlers
        this.off = (type, handler, userId) => {
            const userHandlers = this.handlers.get(userId);
            if (!userHandlers?.has(type))
                return;
            const handlers = userHandlers?.get(type);
            const index = handlers?.indexOf(handler);
            if (index !== -1) {
                handlers?.splice(index, 1);
            }
        };
        // to send the message
        this.send = (userId, type, payload) => {
            const ws = this.CLIENTS.get(userId);
            if (ws && ws.readyState === WebSocket.OPEN) {
                const message = {
                    type,
                    payload,
                };
                ws.send(JSON.stringify(message));
            }
            else {
                console.error("WebSocket is not connnected");
            }
        };
        this.registerUser = (userId, ws) => {
            // storing the user
            this.CLIENTS.set(userId, ws);
            if (!this.handlers.has(userId)) {
                this.handlers.set(userId, new Map());
            }
            console.log("User has been Registered Congo");
            this.send(userId, "userRegisterd", {
                message: "User has Been Registered Thank You",
            });
        };
        this.broadCastMessage = ({ userIds, type, payload, }) => {
            if (userIds.length < 1)
                return;
            userIds.forEach((id) => {
                this.send(id, type, payload);
            });
        };
        this.wss = new WebSocketServer({ server: httpServer });
        this.connect();
    }
}
