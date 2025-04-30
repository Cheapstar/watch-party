import { atom } from "jotai";
import { WebSocketClient } from "./lib/websocketClient";

export const userIdAtom = atom<string>();
export const roomIdAtom = atom<string>();
export const socketAtom = atom<WebSocketClient>();
export const usernameAtom = atom<string>("");
export const roomnameAtom = atom<string>("");
export const isHostAtom = atom<boolean>();
