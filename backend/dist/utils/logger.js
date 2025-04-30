"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const { combine, printf, errors, timestamp } = winston_1.default.format;
// Define colors manually
const levelStyles = {
    info: "\x1b[44m\x1b[37m", // Blue background, White text
    error: "\x1b[41m\x1b[37m", // Red background, White text
    warn: "\x1b[43m\x1b[30m", // Yellow background, Black text
    debug: "\x1b[45m\x1b[37m", // Magenta background, White text
};
const reset = "\x1b[0m"; // Reset to default terminal color
const logFormat = printf(({ level, message, timestamp }) => {
    const color = levelStyles[level] || "";
    const paddedLevel = ` ${level.toUpperCase()} `; // add padding around the text for nicer box
    return `${timestamp} ${color}${paddedLevel}${reset} ${message}`;
});
exports.logger = winston_1.default.createLogger({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), errors({ stack: true }), logFormat),
    transports: [new winston_1.default.transports.Console()],
});
