"use client";
import { WebSocketClient } from "@/lib/websocketClient";
import { socketAtom, userIdAtom } from "@/store";
import { useAtom } from "jotai";
import { useEffect } from "react";

export function useWebSocket() {
  const [socket, setSocket] = useAtom(socketAtom);
  const [userId] = useAtom(userIdAtom);

  useEffect(() => {
    if (!socket && userId) {
      console.log("Registering the user");
      const s = new WebSocketClient(`ws://localhost:8080?userId=${userId}`);
      setSocket(s);
    }
  }, [socket, userId]);
}
