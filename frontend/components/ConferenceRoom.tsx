"use client";

import { useEffect, useState } from "react";
import { useMediasoup } from "./hooks/useMediasoup";
import { useWebSocket } from "./hooks/useWebSocket";
import { isHostAtom, roomIdAtom, userIdAtom, usernameAtom } from "@/store";
import { useAtom } from "jotai";
import { JoinRoomModal } from "./JoinRoomModal";
import { Controls } from "./Controls";
import { VideoRenderer } from "./VideoRenderer";
import { useRooms } from "./hooks/useRooms";
import { UserDetails } from "@/types";
import { ExternalMediaModal } from "./ExternalMediaModal";
import { LayoutGroup, motion } from "motion/react";
import { LiveChat } from "./LiveChat";
import { WebSocketClient } from "@/lib/websocketClient";

export function ConferenceRoom() {
  const [userId] = useAtom(userIdAtom);
  const [username] = useAtom(usernameAtom);
  const [isHost] = useAtom(isHostAtom);
  const [roomId] = useAtom(roomIdAtom);

  const [showExternalMediaModal, setShowExternalMediaModal] =
    useState<boolean>(false);

  const [openLiveChat, setOpenLiveChat] = useState<boolean>(false);

  // Add dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(false);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const {
    externalMediaUrl,
    setExternalMediaUrl,
    handleRemoveExternalMedia,
    mediaKey,
    liveChatMessages,
    setLiveChatMessages,
    socket,
  } = useWebSocket();
  const { joinedStatus, participants } = useRooms();

  const {
    sendCamera,
    sendMicrophone,
    sendScreen,
    userCameraStream,
    userMicrophoneStream,
    userScreenStream,
    turnOffCamera,
    turnOffMic,
    turnOffScreen,
    remoteTracks,
    handleExitOrEndRoom,
  } = useMediasoup({
    joinedStatus,
  });

  useEffect(() => {
    function handleCallEnd() {
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    }

    window.addEventListener("call-ended", handleCallEnd);
    return () => {
      window.removeEventListener("call-ended", handleCallEnd);
    };
  }, []);

  useEffect(() => {
    console.log("Remote Tracks are ", remoteTracks);
  }, [remoteTracks]);

  if (!userId || !username) {
    return <JoinRoomModal />;
  }

  if (participants.size < 1) {
    return <div>Loading...</div>;
  }

  return (
    <main
      className={`h-screen w-screen overflow-hidden ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      }`}
    >
      <motion.div
        layout
        className="relative flex h-full"
      >
        <div className="grow relative h-full">
          <ExternalMediaModal
            setShowExternalMediaModal={setShowExternalMediaModal}
            showExternalMediaModal={showExternalMediaModal}
            setExternalMediaUrl={setExternalMediaUrl}
          ></ExternalMediaModal>

          {/* Controls overlay */}
          <div className="absolute h-[10%] w-[70%] bottom-0 left-[15%] z-[100]">
            <Controls
              userCameraStream={userCameraStream}
              userMicrophoneStream={userMicrophoneStream}
              userScreenStream={userScreenStream}
              sendCamera={sendCamera}
              sendMicrophone={sendMicrophone}
              turnOffCamera={turnOffCamera}
              turnOffMic={turnOffMic}
              handleExitOrEndRoom={handleExitOrEndRoom}
              userDetails={participants.get(userId) as UserDetails}
              setShowExternalMediaModal={setShowExternalMediaModal}
              setOpenLiveChat={setOpenLiveChat}
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
            />
          </div>

          {/* Video Grid */}
          <VideoRenderer
            userId={userId}
            userCameraStream={userCameraStream}
            userMicrophoneStream={userMicrophoneStream}
            userScreenStream={userScreenStream}
            remoteTracks={remoteTracks}
            username={username}
            isHost={isHost as boolean}
            participants={participants}
            sendScreen={sendScreen}
            turnOffScreen={turnOffScreen}
            externalMediaUrl={externalMediaUrl}
            handleRemoveExternalMedia={handleRemoveExternalMedia}
            mediaKey={mediaKey}
          />
        </div>
        {openLiveChat && (
          <motion.div
            layout
            className="w-[300px]"
          >
            <LiveChat
              socket={socket as WebSocketClient}
              messages={liveChatMessages}
              setMessages={setLiveChatMessages}
              participants={participants}
              roomId={roomId as string}
              currentUserId={userId}
            ></LiveChat>
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}
