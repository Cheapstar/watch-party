"use client";

import { UserDetails } from "@/types";
import { useState } from "react";
import { MdMicOff, MdMic, MdVideocam } from "react-icons/md";
import { ProfileAndAudioBlock } from "./ProfileAndAudioBlock";
import { VideoBlock } from "./VideoBlock";

/*
  MediaBlock can be of three types :-
  1. No Audio && Video simple avatar images
  2. No Video only Audio , avatar images + audio visualizer
  3. Video may be audio  or not does not matter
*/

export function UserMediaBlock({
  mediaStream,
  participantDetails,
  user = false,
}: {
  mediaStream: MediaStream;
  participantDetails: UserDetails;
  user?: boolean;
}) {
  const [muted, setMuted] = useState<boolean>(user);

  const hasVideo = mediaStream.getVideoTracks().length > 0;
  const hasMicroPhone = mediaStream.getAudioTracks().length > 0;

  function onToggleMute() {
    if (user) return;

    setMuted((m) => {
      console.log("Setting Mute to ", !m);
      return !m;
    });
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative bg-gray-800 ">
      <div className="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-1 rounded z-10">
        {participantDetails.userName}
      </div>
      <div className="absolute top-2 right-2 flex space-x-2 z-50">
        {hasMicroPhone && (
          <button
            disabled={user}
            onClick={() => {
              onToggleMute();
            }}
            className="text-white bg-black bg-opacity-50 p-2 rounded-full hover:bg-gray-500 transition-all cursor-pointer"
          >
            {muted ? <MdMicOff size={16} /> : <MdMic size={16} />}
          </button>
        )}
        {hasVideo && (
          <span className="text-white bg-black bg-opacity-50 p-2 rounded-full">
            <MdVideocam size={16} />
          </span>
        )}
      </div>
      {hasVideo ? (
        <VideoBlock
          mediaStream={mediaStream}
          muted={muted}
        />
      ) : (
        <ProfileAndAudioBlock
          mediaStream={mediaStream}
          muted={muted}
        />
      )}
    </div>
  );
}
