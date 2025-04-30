// conferenceRoom.tsx
"use client";

import { useEffect } from "react";
import { useMediasoup } from "./hooks/useMediasoup";
import { useWebSocket } from "./hooks/useWebSocket";
import { isHostAtom, userIdAtom, usernameAtom } from "@/store";
import { useAtom } from "jotai";
import { JoinRoomModal } from "./JoinRoomModal";
import { Controls } from "./Controls";
import { VideoRenderer } from "./VideoRenderer";
import { useRooms } from "./hooks/useRooms";
import { UserDetails } from "@/types";

export function ConferenceRoom() {
  const [userId] = useAtom(userIdAtom);
  const [username] = useAtom(usernameAtom);
  const [isHost] = useAtom(isHostAtom);

  useWebSocket();
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
    <main className="relative h-screen w-screen overflow-hidden">
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
      />
    </main>
  );
}
