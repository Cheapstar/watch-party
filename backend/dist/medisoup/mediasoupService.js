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
exports.MediaSoupService = void 0;
const mediasoup_config_1 = require("./config/mediasoup.config");
const mediasoup = __importStar(require("mediasoup"));
const logger_1 = require("../utils/logger");
class MediaSoupService {
    constructor() {
        this.routers = new Map();
        this.createWorker = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const newWorker = yield mediasoup.createWorker(mediasoup_config_1.mediasoupConfig.worker);
                logger_1.logger.info("MediaSoup Worker is successfully created");
                // subscribing to the died event
                newWorker.on("died", () => {
                    logger_1.logger.error("Mediasoup worker died, exiting in 2 seconds.... [pid%id]", newWorker.pid);
                    setTimeout(() => process.exit(1), 2000);
                });
                this.worker = newWorker;
            }
            catch (error) {
                logger_1.logger.error("Could not create the worker", error);
                throw error;
            }
        });
        this.createRouter = (_a) => __awaiter(this, [_a], void 0, function* ({ roomId }) {
            try {
                if (!this.worker) {
                    throw new Error("Worker not initialized");
                }
                const router = yield this.worker.createRouter({
                    mediaCodecs: mediasoup_config_1.mediasoupConfig.router.mediaCodecs,
                });
                logger_1.logger.info("Mediasoup Router has been created succeffully");
                this.routers.set(roomId, router);
                return router;
            }
            catch (error) {
                logger_1.logger.error(`Error while creating the router for the team with teamId:${roomId}`, error);
                throw error;
            }
        });
    }
}
exports.MediaSoupService = MediaSoupService;
