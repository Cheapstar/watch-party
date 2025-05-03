"use client";

import { useRef, useEffect } from "react";

export function VideoBlock({
  mediaStream,
  muted,
}: {
  mediaStream: MediaStream;
  muted: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
      muted={muted}
    ></video>
  );
}
