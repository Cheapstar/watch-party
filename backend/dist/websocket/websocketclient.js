"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketClient = void 0;
const ws_1 = __importStar(require("ws"));
class WebSocketClient {
    constructor(httpServer) {
        this.CLIENTS = new Map(); // userId --- WS
        this.handlers = new Map(); // userId --- (type --- handler)
        this.queues = new Map(); // Per-User-Async-Queue (Just learned)
        this.connect = () => {
            this.wss.on("connection", (ws, req) => {
                var _a;
                console.log("New Connection Established");
                const userId = (_a = req.url) === null || _a === void 0 ? void 0 : _a.split("=")[1];
                console.log("userId", userId);
                ws.on("message", (rawData) => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    const parsedData = JSON.parse(rawData.toString());
                    // Per-user-async-queue setup
                    /*
                        get the last done job might not be completed
                        if(completed) => immediate execution of the new jon
                        else it will be in queue jab previous ho jayega then exec happen
                     */
                    const queue = (_a = this.queues.get(userId)) !== null && _a !== void 0 ? _a : Promise.resolve();
                    const nextJob = queue.then(() => __awaiter(this, void 0, void 0, function* () {
                        var _a;
                        const { type, payload } = parsedData;
                        const userHandlers = (_a = this.handlers
                            .get(userId)) === null || _a === void 0 ? void 0 : _a.get(type);
                        yield Promise.all(userHandlers.map((fn) => fn({ userId, payload })));
                    }));
                    /*
                        Set up the last done job , might not be completed
                    */
                    this.queues.set(userId, nextJob);
                    // Error handling ahhh..
                    nextJob.catch((err) => {
                        console.error("Handler error", err);
                        this.queues.set(userId, Promise.resolve());
                    });
                }));
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
            var _a;
            const userHandlers = this.handlers.get(userId);
            if (!(userHandlers === null || userHandlers === void 0 ? void 0 : userHandlers.has(type))) {
                userHandlers === null || userHandlers === void 0 ? void 0 : userHandlers.set(type, []);
            }
            (_a = userHandlers === null || userHandlers === void 0 ? void 0 : userHandlers.get(type)) === null || _a === void 0 ? void 0 : _a.push(handler);
        };
        // removing the handlers
        this.off = (type, handler, userId) => {
            const userHandlers = this.handlers.get(userId);
            if (!(userHandlers === null || userHandlers === void 0 ? void 0 : userHandlers.has(type)))
                return;
            const handlers = userHandlers === null || userHandlers === void 0 ? void 0 : userHandlers.get(type);
            const index = handlers === null || handlers === void 0 ? void 0 : handlers.indexOf(handler);
            if (index !== -1) {
                handlers === null || handlers === void 0 ? void 0 : handlers.splice(index, 1);
            }
        };
        // to send the message
        this.send = (userId, type, payload) => {
            const ws = this.CLIENTS.get(userId);
            if (ws && ws.readyState === ws_1.default.OPEN) {
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
        this.wss = new ws_1.WebSocketServer({ server: httpServer });
    }
}
exports.WebSocketClient = WebSocketClient;
