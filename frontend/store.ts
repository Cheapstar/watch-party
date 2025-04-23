import { atom } from "jotai";
import { WebSocketClient } from "./lib/websocketClient";

export const userIdAtom = atom<string>();
export const roomIdAtom = atom<string>();
export const socketAtom = atom<WebSocketClient>();
