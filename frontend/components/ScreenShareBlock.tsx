"use client";

import { UserDetails } from "@/types";
import { useState, useRef } from "react";
import { MdFullscreen, MdMicOff, MdMic, MdClose } from "react-icons/md";
import { VideoBlock } from "./VideoBlock";

/*
  What will this Show, 
  1. Agar koi bhi ni screen share kar raha then => Single Button "Share-Screen"
  2. Agar Anyone is sharing the stream then that stream
*/
export function ScreenShareBlock({
  participantDetails,
  mediaStream,
  sendScreen,
  turnOffScreen,
  isSender,
  isScreenShared,
  className,
}: {
  participantDetails: UserDetails;
  sendScreen: () => Promise<void>;
  turnOffScreen: () => void;
  mediaStream?: MediaStream;
  isSender: boolean;
  isScreenShared: boolean;
  className?: string;
}) {
  const [, setIsFullScreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState<boolean>(false); // Default to not muted for everyone

  function handleScreenSharing() {
    if (!participantDetails.permissions.canShareScreen) return;
    sendScreen();
  }

  function handleStopScreenSharing() {
    if (!mediaStream) return;
    turnOffScreen();
  }

  async function toggleFullScreen() {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch((err) => {
        console.error(
          `Error attempting to enable full-screen mode: ${err.message}`
        );
      });
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  }

  function onToggleMute() {
    setMuted((m) => !m);
  }

  return (
    <div
      ref={containerRef}
      className={`w-full h-full rounded-lg overflow-hidden relative bg-gray-800 ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {isScreenShared && (
        <div className="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-1 rounded z-10">
          {participantDetails.userName}&apos;s screen
        </div>
      )}

      {/* Full Screen Button */}
      {isScreenShared && (
        <div className="absolute top-2 left-2 z-50">
          <button
            onClick={toggleFullScreen}
            className="text-white bg-black bg-opacity-50 p-2 rounded-full hover:bg-gray-500 transition-all"
          >
            <MdFullscreen size={18} />
          </button>
        </div>
      )}

      {/* Mic control - only shown on hover and for screens with audio */}
      {mediaStream && showControls && (
        <div className="absolute top-2 right-2 flex space-x-2 z-50">
          <button
            onClick={onToggleMute}
            className="text-white bg-black bg-opacity-50 p-2 rounded-full hover:bg-gray-500 transition-all cursor-pointer"
          >
            {muted ? <MdMicOff size={16} /> : <MdMic size={16} />}
          </button>
        </div>
      )}

      <div className="w-full h-full flex justify-center items-center relative">
        {mediaStream ? (
          <VideoBlock
            mediaStream={mediaStream}
            muted={isSender || muted} // Always mute for sender
          />
        ) : (
          !isScreenShared && (
            <button
              onClick={handleScreenSharing}
              className="px-6 py-2.5 rounded-md text-white bg-gray-700 hover:bg-gray-600 transition-all"
            >
              Share Screen
            </button>
          )
        )}

        {/* Stop Stream Button - Only shown on hover and only for sender */}
        {isSender && showControls && mediaStream && (
          <div className="absolute top-2 right-2 z-50">
            <button
              onClick={handleStopScreenSharing}
              className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 transition-all flex items-center gap-2"
            >
              <MdClose size={16} /> Stop Sharing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
