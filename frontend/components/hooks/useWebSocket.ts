/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { WebSocketClient } from "@/lib/websocketClient";
import { socketAtom, userIdAtom } from "@/store";
import { RoomDetails } from "@/types";
import { useAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";

export function useWebSocket() {
  const [socket, setSocket] = useAtom(socketAtom);
  const [userId] = useAtom(userIdAtom);
  const [externalMediaUrl, setExternalMediaUrl] = useState<string>("");
  const [mediaKey, setMediaKey] = useState<number>(0);
  const [roomDetails, setRoomDetails] = useState<RoomDetails>();
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!socket && userId) {
      console.log("Registering the user");
      const s = new WebSocketClient(`ws://localhost:8080?userId=${userId}`);

      s.onConnectionEstablished(() => {
        setIsConnected(true);
      });

      setSocket(s);
    }
  }, [socket, userId, setSocket]);

  useEffect(() => {
    function loadExternalMedia(payload: { url: string }) {
      console.log("Loading external media:", payload.url);
      setExternalMediaUrl(payload.url);
      setMediaKey((prevKey) => prevKey + 1); // Force re-render of player
    }

    function unloadExternalMedia() {
      console.log("Unloading external media");
      setExternalMediaUrl("");
    }

    function loadRoomDetails(payload: { roomDetails: RoomDetails }) {
      const rd = payload.roomDetails;
      setRoomDetails(rd);

      console.log("Room Details Loading", rd);
      if (rd.externalMedia) {
        setExternalMediaUrl(rd.externalMedia);
      }
    }

    function clientLoaded() {
      if (socket) {
        socket.send("get-roomDetails", "");
      }
    }
    if (socket) {
      socket.on("load-external-media", loadExternalMedia);
      socket.on("unload-external-media", unloadExternalMedia);
      socket.on("roomDetails", loadRoomDetails);
      socket.on("client-loaded", clientLoaded);
    }

    return () => {
      if (socket) {
        socket.off("load-external-media", loadExternalMedia);
        socket.off("unload-external-media", unloadExternalMedia);
        socket.off("roomDetails", loadRoomDetails);
        socket.off("client-loaded", clientLoaded);
      }
    };
  }, [socket]);

  const handleRemoveExternalMedia = useCallback(() => {
    if (socket) {
      console.log("Removing external media");
      setExternalMediaUrl("");
      socket.send("remove-external-media", "");
    }
  }, [socket]);

  useEffect(() => {
    if (socket) {
    }
  }, [socket]);

  const sendExternalMedia = useCallback(
    (url: string) => {
      if (socket) {
        console.log("Sending external media:", url);
        socket.send("add-external-media", { url });
      }
    },
    [socket]
  );

  return {
    socket,
    externalMediaUrl,
    mediaKey,
    setExternalMediaUrl,
    handleRemoveExternalMedia,
    sendExternalMedia,
    roomDetails,
  };
}
