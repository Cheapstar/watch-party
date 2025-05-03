"use client";

import { useRef, useEffect } from "react";
import { AudioVisualizer } from "./AudioVisualizer";

export function ProfileAndAudioBlock({
  mediaStream,
  muted,
}: {
  mediaStream: MediaStream;
  muted: boolean;
}) {
  const hasAudio = mediaStream.getAudioTracks().length > 0;
  const audioRef = useRef<HTMLAudioElement>(null);
  const avatarSize = 96; // This is fine as a variable

  useEffect(() => {
    if (audioRef.current && mediaStream) {
      audioRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  return (
    <div className="w-full h-full flex justify-center items-center relative z-0">
      {/* Use fixed Tailwind classes instead of template literals */}
      <div className="w-24 h-24 rounded-full z-20">
        <img
          src="https://api.dicebear.com/9.x/dylan/svg?radius=50"
          alt="user-avatar"
          className="object-cover w-full h-full rounded-full"
        />
      </div>

      {hasAudio && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <AudioVisualizer
            audioStream={mediaStream}
            size={avatarSize}
          />
        </div>
      )}

      {hasAudio && (
        <audio
          ref={audioRef}
          autoPlay
          playsInline
          muted={muted}
        ></audio>
      )}
    </div>
  );
}
