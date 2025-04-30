/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { MediasoupClient } from "@/lib/mediasoupclient";
import { RemoteMedia } from "@/types";
import {
  roomIdAtom,
  roomnameAtom,
  socketAtom,
  userIdAtom,
  usernameAtom,
} from "@/store";
import { useAtom } from "jotai";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { redirect, RedirectType } from "next/navigation";

export function useMediasoup({ joinedStatus }: { joinedStatus: boolean }) {
  const [msClient, setMsClient] = useState<MediasoupClient>();
  const [socket] = useAtom(socketAtom);
  const [userCameraStream, setUserCameraStream] = useState<MediaStream>();
  const [userMicrophoneStream, setUserMicrophoneStream] =
    useState<MediaStream>();
  const [userScreenStream, setUserScreenStream] = useState<MediaStream>();
  const [userId] = useAtom(userIdAtom);

  const [remoteTracks, setRemoteTracks] = useState<Map<string, RemoteMedia>>(
    new Map()
  );

  // Create Mediasoup Client
  useEffect(() => {
    if (socket && joinedStatus && userId) {
      const msc = new MediasoupClient(socket, userId);

      setMsClient(msc);

      console.log("Mediasoup Client Created");
    }
  }, [socket, joinedStatus, userId]);

  useEffect(() => {
    if (socket && msClient && joinedStatus) {
      console.log("Sending Rtp Capabilities");

      socket.send("send-rtpCapabilities", "");
    }
  }, [socket, msClient, joinedStatus]);

  useEffect(() => {
    /* On Unmount if there is any stream turn them Off */
    return () => {
      turnOffCamera();
      turnOffMic();
      turnOffScreen();
    };
  }, []);

  /*
    Two Functions for sending the video, 
    one for screen sharing and other for 
    camera and other for audio
  */

  const sendCamera = useCallback(async () => {
    // Check if camera is allowed
    if (msClient && socket) {
      try {
        await checkPermission("camera");

        const camera = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        setUserCameraStream(camera);

        /*
        Create Producer
      */
        await msClient.createVideoProducer(camera, "camera");
      } catch (error) {
        console.log(
          error instanceof Error
            ? error.message
            : `Permission Denied to use the camera, check your system`
        );
        return;
      }
    }
  }, [msClient, socket]);

  const sendMicrophone = useCallback(async () => {
    // Check if camera is allowed
    if (msClient && socket) {
      try {
        await checkPermission("microphone");

        const microphone = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        setUserMicrophoneStream(microphone);

        /*
        Create Producer
      */
        await msClient.createAudioProducer(microphone, "microphone");
      } catch (error) {
        console.log(
          error instanceof Error
            ? error.message
            : `Permission Denied to use the Microphone, check your system`
        );
        return;
      }
    }
  }, [msClient, socket]);

  const sendScreen = useCallback(async () => {
    // Check if camera is allowed
    if (msClient && socket) {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        if (!screen) {
          console.log("Permission to Share the Screen has been Denied");
          return;
        }

        setUserScreenStream(screen);

        /*
        Create Producer
      */
        await msClient.createVideoProducer(screen, "screen");
        await msClient.createAudioProducer(screen, "screen-audio");
      } catch (error) {
        console.log(
          error instanceof Error
            ? error.message
            : `Permission Denied to use the screen, check your system`
        );
        return;
      }
    }
  }, [msClient, socket]);

  const turnOffCamera = useCallback(() => {
    if (userCameraStream && socket && msClient) {
      msClient.closeMediaProducer("camera");
      userCameraStream.getTracks().forEach((t) => t.stop());
      setUserCameraStream(undefined);
    }
  }, [userCameraStream, socket, msClient]);

  const turnOffMic = useCallback(() => {
    if (userMicrophoneStream && socket && msClient) {
      msClient.closeMediaProducer("microphone");
      userMicrophoneStream.getTracks().forEach((t) => t.stop());
      setUserMicrophoneStream(undefined);
    }
  }, [userMicrophoneStream, socket, msClient]);

  const turnOffScreen = useCallback(() => {
    if (userScreenStream && socket && msClient) {
      msClient.closeMediaProducer("screen");
      msClient.closeMediaProducer("screen-audio");
      userScreenStream.getTracks().forEach((t) => t.stop());
      setUserScreenStream(undefined);
    }
  }, [userScreenStream, socket, msClient]);

  const checkPermission = useCallback(async (type: "camera" | "microphone") => {
    try {
      const isAllowed = await navigator.permissions.query({
        name: type,
      });

      if (isAllowed.state === "denied" || isAllowed.state === "prompt") {
        alert(`Please Allow Permission in the your system to use ${type}`);
        throw new Error("Permission Denied");
      }
      return;
    } catch (error) {
      console.log(
        error instanceof Error
          ? error.message
          : `Permission Denied to use the ${type}, check your system`
      );

      throw new Error(
        `Please Allow Permission in the your system to use ${type}`
      );
    }
  }, []);

  const handleExitOrEndRoom = useCallback(
    async (isHost: boolean) => {
      /*
      - Notify karna hai to the server
      - Isme We would need to handle for things like agar local resources use ho rahe hai then unhe band karna hai
      - msClient ko close karna hai 
      - redirect to the homePage
    */
      if (socket && msClient) {
        const sendEvent = isHost ? "end-call" : "exit-room";

        if (sendEvent === "exit-room") {
          await msClient.closeAllProducers();
          await msClient.closeAllProducers();
        }

        socket.send(sendEvent, "");

        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      }
    },
    [socket, msClient, turnOffCamera, turnOffMic, turnOffMic]
  );

  // In useMediasoup hook
  useEffect(() => {
    if (!msClient) return;

    const handleCallEnded = () => {
      // Reset all local states
      setUserCameraStream(undefined);
      setUserMicrophoneStream(undefined);
      setUserScreenStream(undefined);
      setRemoteTracks(new Map());
    };

    window.addEventListener("call-ended", handleCallEnded);

    return () => {
      window.removeEventListener("call-ended", handleCallEnded);
    };
  }, [msClient]);

  useEffect(() => {
    if (!msClient) return;

    const handleNewTrack = () => {
      // Get remote tracks from msClient and update state
      console.log("New Remote Track Added Upadating th remote Tracks State");
      const tracks = new Map();
      msClient.remoteTracks.forEach((rm, id) => {
        tracks.set(id, rm);
      });
      setRemoteTracks(tracks);
    };

    // Listen for track updates
    window.addEventListener("new-remote-track", handleNewTrack);

    return () => {
      window.removeEventListener("new-remote-track", handleNewTrack);
    };
  }, [msClient]);

  // Return remoteTracks from the hook
  return {
    sendCamera,
    sendMicrophone,
    sendScreen,
    userCameraStream,
    userMicrophoneStream,
    userScreenStream,
    remoteTracks,
    turnOffCamera,
    turnOffMic,
    turnOffScreen,
    handleExitOrEndRoom,
  };
}
