"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWorker = createWorker;
exports.getWorker = getWorker;
exports.closeWorker = closeWorker;
const mediasoup_1 = __importDefault(require("mediasoup"));
const mediasoup_config_1 = require("./config/mediasoup.config");
let worker;
function createWorker() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const newWorker = yield mediasoup_1.default.createWorker(mediasoup_config_1.mediasoupConfig.worker);
            // subscribing to the dead event
            newWorker.on("died", () => {
                console.log("Worker died with,exiting in 2 second with [pid%id]", newWorker.pid);
            });
            worker = newWorker;
        }
        catch (error) {
            console.log("Error occured while creating the mediasoup worker");
            throw new Error("Couldn't create the worker , please check");
        }
    });
}
function getWorker() {
    ensureWorkerExists();
    return worker;
}
function closeWorker() {
    try {
        worker.close();
    }
    catch (error) {
        console.log("Error Occured while closing the worker");
    }
}
function ensureWorkerExists() {
    if (worker)
        return;
    console.log(`Worker Does not exists,Restart the server`);
    throw new Error(`Worker Does not exists,Restart the server`);
}
