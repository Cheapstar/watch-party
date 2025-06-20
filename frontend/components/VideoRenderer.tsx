/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React from "react";
import { useEffect, useRef, useState } from "react";
import {
  MdClose,
  MdFullscreen,
  MdMic,
  MdMicOff,
  MdVideocam,
} from "react-icons/md";
import { RemoteMedia, UserDetails } from "@/types";
import { AudioVisualizer } from "./AudioVisualizer";
import { YTPlayer } from "./YTPlayer";
import { YouTubePlayerWrapper } from "./YTPlayerWrapper";
import { UserMediaBlock } from "./UserMediaBlock";
import { ScreenShareBlock } from "./ScreenShareBlock";
type VideoRenderProps = {
  userId: string;
  userCameraStream: MediaStream | undefined;
  userMicrophoneStream: MediaStream | undefined;
  userScreenStream: MediaStream | undefined;
  remoteTracks: Map<string, RemoteMedia>;
  username: string;
  isHost: boolean;
  participants: Map<string, UserDetails>;
  sendScreen: () => Promise<void>;
  turnOffScreen: () => void;
  externalMediaUrl: string;
  handleRemoveExternalMedia: () => void;
  mediaKey?: number;
  darkMode: boolean;
};

/*
  We Will make a video Element , for individual streams,

  There will be 2 kinds of data for room :-

  1. Mediasoup se remote tracks
  2. roomDetails :- everything about room from httpserver, participants details whatever is neccessary
      basically list of participants
      websocket se we will communicate the data about permissions

  Using these two hum saare elements render karenge 

*/

/*
  As per all the Participants MediaBlock Banenge, 
  Uss MediaBlock pe user ke "camera" and "microphone" tracks chalenge from remoteTracks

  so Total Participants can be found on by using the participants

*/

/*
  For Screen Sharing :-
  1. Check agar local stream sharing ho rahi hai then wo waali stream 
     else check agar koi remotely kar raha hai then wo waali

*/

export function VideoRenderer({
  userId,
  userCameraStream,
  userMicrophoneStream,
  userScreenStream,
  remoteTracks,
  username,
  isHost,
  participants,
  sendScreen,
  turnOffScreen,
  externalMediaUrl,
  handleRemoveExternalMedia,
  mediaKey = 0,
  darkMode,
}: VideoRenderProps) {
  const totalParticipants = participants.size;
  const localAudioVideoStream = new MediaStream();
  const hasExternalMedia = !!externalMediaUrl;

  let isScreenShared = false;
  // Check if screen is being shared (either local or remote)
  let remoteScreenStream: MediaStream | undefined = undefined;
  let remoteScreenSenderId: string | undefined = undefined;

  remoteTracks.forEach((rm, id) => {
    if (!remoteScreenStream) {
      const newScreenStream = new MediaStream();
      if (rm.screenAudio) {
        newScreenStream.addTrack(rm.screenAudio);
      }

      if (rm.screen) {
        newScreenStream.addTrack(rm.screen);
        remoteScreenSenderId = id;
        isScreenShared = true;
        console.log("SENDER ID IS");
        remoteScreenStream = newScreenStream;
      }
    }
  });

  if (userCameraStream) {
    localAudioVideoStream.addTrack(userCameraStream.getTracks()[0]);
  }

  if (userMicrophoneStream) {
    localAudioVideoStream.addTrack(userMicrophoneStream.getTracks()[0]);
  }

  // Calculate the grid layout based on participants count, screen sharing, and external media
  const getGridContainerStyle = () => {
    if (hasExternalMedia) {
      // When YouTube video is present,  a specific layout
      return "grid-cols-4";
    } else if (isScreenShared) {
      if (totalParticipants === 1) return "grid-cols-1";
      if (totalParticipants === 2) return "grid-cols-1";
      if (totalParticipants <= 4) return "grid-cols-4";
      return "grid-cols-5";
    } else {
      // Default grid layout when no screen is shared
      if (totalParticipants === 1) return "grid-cols-1";
      if (totalParticipants === 2) return "grid-cols-2";
      if (totalParticipants <= 4) return "grid-cols-2";
      if (totalParticipants <= 9) return "grid-cols-3";
      return "grid-cols-4";
    }
  };

  const styles = darkMode ? "bg-[#0F172A]" : "bg-[#FEFEFE]";

  return (
    <div className={` h-screen  p-4 overflow-hidden z-0 ${styles}`}>
      <div
        className={`grid ${getGridContainerStyle()} gap-4 h-full auto-rows-fr z-0`}
      >
        {/* YouTube Player - takes priority if present */}
        {hasExternalMedia && (
          <YouTubePlayerWrapper
            url={externalMediaUrl}
            handleRemoveExternalMedia={handleRemoveExternalMedia}
            mediaKey={mediaKey}
            darkMode={darkMode}
          />
        )}

        {/* Screen sharing block - only show if no YouTube video or alongside it */}
        <ScreenShareBlock
          mediaStream={userScreenStream || remoteScreenStream}
          participantDetails={
            userScreenStream
              ? (participants.get(userId) as UserDetails)
              : remoteScreenSenderId
              ? (participants.get(remoteScreenSenderId) as UserDetails)
              : (participants.get(userId) as UserDetails)
          }
          sendScreen={sendScreen}
          turnOffScreen={turnOffScreen}
          isSender={!!userScreenStream}
          isScreenShared={isScreenShared}
          className={hasExternalMedia ? "col-span-1" : "col-span-3 row-span-2"}
          darkMode={darkMode}
        />

        {/* User's own video */}
        <div
          className={
            isScreenShared || hasExternalMedia
              ? "col-span-1"
              : "col-span-3 row-span-2"
          }
        >
          <UserMediaBlock
            mediaStream={localAudioVideoStream}
            participantDetails={participants.get(userId) as UserDetails}
            user={true}
            darkMode={darkMode}
          />
        </div>

        {/* Remote participants' videos */}
        {Array.from(participants.entries())
          .filter((value) => value[0] !== userId)
          .map(([id, participant]) => {
            const rm = remoteTracks.get(id);
            const mediaStream = new MediaStream();

            if (rm && rm.camera) {
              mediaStream.addTrack(rm.camera);
            }

            if (rm && rm.microphone) {
              mediaStream.addTrack(rm.microphone);
            }

            return (
              <div
                key={id}
                className={
                  isScreenShared || hasExternalMedia ? "col-span-1" : ""
                }
              >
                <UserMediaBlock
                  mediaStream={mediaStream}
                  participantDetails={participant}
                  darkMode={darkMode}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
}

// function RemoteVideo({
//   stream,
//   username,
//   hasMicrophone,
//   muted,
//   onToggleMute,
//   isScreenShare,
// }: {
//   stream: MediaStream;
//   username: string;
//   hasMicrophone: boolean;
//   muted: boolean;
//   onToggleMute: () => void;
//   isScreenShare: boolean;
// }) {
//   const videoRef = useRef<HTMLVideoElement>(null);

//   useEffect(() => {
//     if (videoRef.current && stream) {
//       videoRef.current.srcObject = stream;
//     }
//   }, [stream]);

//   return (
//     <div className="w-full h-full rounded-lg overflow-hidden relative bg-gray-800">
//       <video
//         ref={videoRef}
//         autoPlay
//         playsInline
//         className={`w-full h-full ${
//           isScreenShare ? "object-contain" : "object-cover"
//         }`}
//       />
//       <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm">
//         {username}
//       </div>
//       <div className="absolute bottom-2 right-2 flex space-x-2">
//         {hasMicrophone && (
//           <button
//             onClick={onToggleMute}
//             className="text-white bg-black bg-opacity-50 p-2 rounded-full"
//           >
//             {muted ? <MdMicOff size={16} /> : <MdMic size={16} />}
//           </button>
//         )}
//         {!isScreenShare && (
//           <span className="text-white bg-black bg-opacity-50 p-2 rounded-full">
//             <MdVideocam size={16} />
//           </span>
//         )}
//       </div>
//     </div>
//   );
// }

// Helper component for remote videos
// // Track the remote participants for rendering
// const [remoteParticipants, setRemoteParticipants] = useState<
//   Map<
//     string,
//     {
//       userId: string;
//       username: string;
//       cameraStream?: MediaStream;
//       screenStream?: MediaStream;
//       hasMicrophone: boolean;
//       microphoneMuted: boolean;
//     }
//   >
// >(new Map());

// // Refs for local media
// const localCameraRef = useRef<HTMLVideoElement>(null);
// const localScreenRef = useRef<HTMLVideoElement>(null);

// // Set up local camera stream
// useEffect(() => {
//   if (localCameraRef.current && userCameraStream) {
//     localCameraRef.current.srcObject = userCameraStream;
//   }
// }, [userCameraStream]);

// // Set up local screen share
// useEffect(() => {
//   if (localScreenRef.current && userScreenStream) {
//     localScreenRef.current.srcObject = userScreenStream;
//   }
// }, [userScreenStream]);

// // Process remote tracks into streams
// useEffect(() => {
//   const participants = new Map();

//   // Process all remote tracks
//   remoteTracks.forEach((trackData, userId) => {
//     // Skip if userId is empty
//     if (!userId) return;

//     // Create or retrieve participant data
//     const participant = participants.get(trackData.from) || {
//       userId: trackData.from,
//       username: trackData.fromusername,
//       hasMicrophone: false,
//       microphoneMuted: false,
//     };

//     // Create camera stream if there's a camera track
//     if (trackData.camera) {
//       if (!participant.cameraStream) {
//         participant.cameraStream = new MediaStream();
//       }

//       // Check if track already exists in the stream to avoid duplicates
//       const trackExists = Array.from(
//         participant.cameraStream.getTracks()
//       ).some((track) => track.id === trackData.camera?.id);

//       if (!trackExists && trackData.camera) {
//         participant.cameraStream.addTrack(trackData.camera);
//       }
//     }

//     // Create screen stream if there's a screen track
//     if (trackData.screen) {
//       if (!participant.screenStream) {
//         participant.screenStream = new MediaStream();
//       }

//       // Check if track already exists in the stream to avoid duplicates
//       const trackExists = Array.from(
//         participant.screenStream.getTracks()
//       ).some((track) => track.id === trackData.screen?.id);

//       if (!trackExists && trackData.screen) {
//         participant.screenStream.addTrack(trackData.screen);
//       }
//     }

//     // Add screen audio to screen stream if exists
//     if (trackData.screenAudio && participant.screenStream) {
//       const trackExists = Array.from(
//         participant.screenStream.getTracks()
//       ).some((track) => track.id === trackData.screenAudio?.id);

//       if (!trackExists && trackData.screenAudio) {
//         participant.screenStream.addTrack(trackData.screenAudio);
//       }
//     }

//     // Check if participant has microphone
//     if (trackData.microphone) {
//       participant.hasMicrophone = true;

//       // Add microphone track to camera stream for audio
//       if (participant.cameraStream) {
//         const trackExists = Array.from(
//           participant.cameraStream.getTracks()
//         ).some((track) => track.id === trackData.microphone?.id);

//         if (!trackExists && trackData.microphone) {
//           participant.cameraStream.addTrack(trackData.microphone);
//         }
//       }
//     }

//     participants.set(trackData.from, participant);
//   });

//   setRemoteParticipants(participants);
// }, [remoteTracks]);

// // Toggle mute for remote participants
// const toggleRemoteAudioMute = (userId: string) => {
//   setRemoteParticipants((prev) => {
//     const updated = new Map(prev);
//     const participant = updated.get(userId);

//     if (participant) {
//       participant.microphoneMuted = !participant.microphoneMuted;

//       // Mute the audio tracks
//       if (participant.cameraStream) {
//         participant.cameraStream.getAudioTracks().forEach((track) => {
//           track.enabled = !participant.microphoneMuted;
//         });
//       }

//       if (participant.screenStream) {
//         participant.screenStream.getAudioTracks().forEach((track) => {
//           track.enabled = !participant.microphoneMuted;
//         });
//       }

//       updated.set(userId, participant);
//     }

//     return updated;
//   });
// };

// // Calculate grid layout based on number of participants
// const calculateGridClasses = () => {
//   const totalVideo =
//     (userCameraStream ? 1 : 0) +
//     (userScreenStream ? 1 : 0) +
//     Array.from(remoteParticipants.values()).reduce(
//       (acc, p) => acc + (p.cameraStream ? 1 : 0) + (p.screenStream ? 1 : 0),
//       0
//     );

//   if (totalVideo <= 1) return "w-full h-full";
//   if (totalVideo === 2) return "w-1/2 h-full";
//   if (totalVideo <= 4) return "w-1/2 h-1/2";
//   if (totalVideo <= 6) return "w-1/3 h-1/2";
//   if (totalVideo <= 9) return "w-1/3 h-1/3";
//   return "w-1/4 h-1/4";
// };

// const gridClass = calculateGridClasses();

// // Prepare all video elements to render with unique keys
// const videoElements = [];

// // Add local camera
// if (userCameraStream) {
//   videoElements.push(
//     <div
//       key="local-camera"
//       className={`${gridClass} p-1 relative`}
//     >
//       <div className="w-full h-full rounded-lg overflow-hidden relative bg-gray-800">
//         <video
//           ref={localCameraRef}
//           autoPlay
//           playsInline
//           muted
//           className="w-full h-full object-cover"
//         />
//         <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm">
//           {username} (You)
//         </div>
//         <div className="absolute bottom-2 right-2 flex space-x-2">
//           {userMicrophoneStream && (
//             <span className="text-white bg-black bg-opacity-50 p-2 rounded-full">
//               <MdMic size={16} />
//             </span>
//           )}
//           <span className="text-white bg-black bg-opacity-50 p-2 rounded-full">
//             <MdVideocam size={16} />
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Add local screen
// if (userScreenStream) {
//   videoElements.push(
//     <div
//       key="local-screen"
//       className={`${gridClass} p-1 relative`}
//     >
//       <div className="w-full h-full rounded-lg overflow-hidden relative bg-gray-800">
//         <video
//           ref={localScreenRef}
//           autoPlay
//           playsInline
//           muted
//           className="w-full h-full object-contain"
//         />
//         <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm">
//           {username}'s Screen (You)
//         </div>
//       </div>
//     </div>
//   );
// }

// // Add remote participants
// Array.from(remoteParticipants.entries()).forEach(([id, participant]) => {
//   // Add remote camera
//   if (participant.cameraStream) {
//     videoElements.push(
//       <div
//         key={`camera-${id}`}
//         className={`${gridClass} p-1 relative`}
//       >
//         <RemoteVideo
//           stream={participant.cameraStream}
//           username={participant.username}
//           hasMicrophone={participant.hasMicrophone}
//           muted={participant.microphoneMuted}
//           onToggleMute={() => toggleRemoteAudioMute(participant.userId)}
//           isScreenShare={false}
//         />
//       </div>
//     );
//   }

//   // Add remote screen
//   if (participant.screenStream) {
//     videoElements.push(
//       <div
//         key={`screen-${id}`}
//         className={`${gridClass} p-1 relative`}
//       >
//         <RemoteVideo
//           stream={participant.screenStream}
//           username={`${participant.username}'s Screen`}
//           hasMicrophone={false}
//           muted={false}
//           onToggleMute={() => {}}
//           isScreenShare={true}
//         />
//       </div>
//     );
//   }
// });

// return (
//   <div className="flex flex-wrap h-screen w-full bg-gray-900 overflow-auto">
//     {videoElements.length > 0 ? (
//       videoElements
//     ) : (
//       <div className="w-full h-full flex items-center justify-center">
//         <div className="text-white text-center">
//           <div className="text-4xl mb-4">No active video</div>
//           <div className="text-xl text-gray-400">
//             Use the controls at the bottom to turn on your camera or screen
//             share
//           </div>
//         </div>
//       </div>
//     )}
//   </div>
// );
