/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { WebSocketClient } from "@/lib/websocketClient";
import { socketAtom, userIdAtom } from "@/store";
import { MessageType, RoomDetails } from "@/types";
import { useAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";

export function useWebSocket() {
  const [socket, setSocket] = useAtom(socketAtom);
  const [userId] = useAtom(userIdAtom);
  const [externalMediaUrl, setExternalMediaUrl] = useState<string>("");
  const [mediaKey, setMediaKey] = useState<number>(0);
  const [roomDetails, setRoomDetails] = useState<RoomDetails>();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [liveChatMessages, setLiveChatMessages] = useState<MessageType[]>([]);

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

  // Event Setup and Handlers for websocket
  useEffect(() => {
    function loadExternalMedia(payload: { url: string }) {
      console.log("Loading external media:", payload.url);
      setExternalMediaUrl(payload.url);
      setMediaKey((prevKey) => prevKey + 1);
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
        socket.send("livechat-get-messages", "");
      }
    }

    function handleNewLiveChatMessage(payload: { message: MessageType }) {
      const { message: newMessage } = payload;
      setLiveChatMessages((prevState) => {
        const newState = [...prevState];

        newState.push(newMessage);
        return newState;
      });
    }

    function handleLoadMessages(payload: { messages: MessageType[] }) {
      const { messages } = payload;

      setLiveChatMessages((prevState) => {
        const newState = [...messages];

        return newState;
      });
    }

    if (socket) {
      socket.on("load-external-media", loadExternalMedia);
      socket.on("unload-external-media", unloadExternalMedia);
      socket.on("roomDetails", loadRoomDetails);
      socket.on("client-loaded", clientLoaded);
      socket.on("livechat-new-message", handleNewLiveChatMessage);
      socket.on("livechat-load-messages", handleLoadMessages);
    }

    return () => {
      if (socket) {
        socket.off("load-external-media", loadExternalMedia);
        socket.off("unload-external-media", unloadExternalMedia);
        socket.off("roomDetails", loadRoomDetails);
        socket.off("client-loaded", clientLoaded);
        socket.off("livechat-new-message", handleNewLiveChatMessage);
        socket.off("livechat-load-messages", handleLoadMessages);
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
    liveChatMessages,
    setLiveChatMessages,
  };
}
