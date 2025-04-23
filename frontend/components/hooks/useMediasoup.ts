"use client";

import { MediasoupClient } from "@/lib/mediasoupclient";
import { socketAtom } from "@/store";
import { useAtom } from "jotai";
import { Producer } from "mediasoup-client/types";

import { useCallback, useEffect, useState } from "react";

export function useMediasoup() {
  const [msClient, setMsClient] = useState<MediasoupClient>();
  const [socket] = useAtom(socketAtom);
  const [userCameraStream, setUserCameraStream] = useState<MediaStream>();
  // const [remoteTracks, setRemoteTracks] = useState();

  useEffect(() => {
    if (socket) {
      const msc = new MediasoupClient(socket);
      setMsClient(msc);
    }
  }, [socket]);

  useEffect(() => {
    if (socket && msClient) {
      socket.send("sendRtpCapabilities", "");
    }
  }, [socket, msClient]);

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
        await msClient.createVideoProducer(camera);
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

        setUserCameraStream(microphone);

        /*
        Create Producer
      */
        await msClient.createAudioProducer(microphone);
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

        setUserCameraStream(screen);

        /*
        Create Producer
      */
        await msClient.createVideoProducer(screen);
        await msClient.createAudioProducer(screen);
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
}
