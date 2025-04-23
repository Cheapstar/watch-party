"use client";
import { WebSocketClient } from "@/lib/websocketClient";
import { socketAtom, userIdAtom } from "@/store";
import { useAtom } from "jotai";
import { useEffect } from "react";

export function useWebSocket() {
  const [, setSocket] = useAtom(socketAtom);
  const [userId] = useAtom(userIdAtom);

  useEffect(() => {
    const s = new WebSocketClient(`http://localhost:8080?userId=${userId}`);
    setSocket(s);
  }, []);
}
