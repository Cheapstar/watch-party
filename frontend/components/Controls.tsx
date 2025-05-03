"use client";
import { useState } from "react";
import { MdMic, MdMicOff } from "react-icons/md";
import { FiCamera, FiCameraOff } from "react-icons/fi";
import { IoCall } from "react-icons/io5";
import { MdOutlineExitToApp } from "react-icons/md";
import { RiExternalLinkLine } from "react-icons/ri";
import { BsChatLeftText } from "react-icons/bs";
import { MdOutlineLightMode, MdOutlineDarkMode } from "react-icons/md";

import { UserDetails } from "@/types";

interface props {
  userCameraStream: MediaStream | undefined;
  userMicrophoneStream: MediaStream | undefined;
  userScreenStream: MediaStream | undefined;
  sendCamera: () => Promise<void>;
  sendMicrophone: () => Promise<void>;
  turnOffCamera: () => void;
  turnOffMic: () => void;
  handleExitOrEndRoom: (isHost: boolean) => void;
  setShowExternalMediaModal: (v: boolean) => void;
  userDetails: UserDetails;
  setOpenLiveChat: (v: boolean | ((v: boolean) => boolean)) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export function Controls({
  userCameraStream,
  userMicrophoneStream,
  sendCamera,
  sendMicrophone,
  setShowExternalMediaModal,
  turnOffCamera,
  turnOffMic,
  userDetails,
  handleExitOrEndRoom,
  setOpenLiveChat,
  darkMode,
  toggleDarkMode,
}: props) {
  const [displayControls, setDisplayControls] = useState<boolean>(false);

  const handleCameraToggle = () => {
    if (userCameraStream) {
      turnOffCamera();
    } else {
      sendCamera();
    }
  };

  const handleMicrophoneToggle = () => {
    if (userMicrophoneStream) {
      turnOffMic();
    } else {
      sendMicrophone();
    }
  };

  return (
    <section
      onMouseEnter={() => {
        setDisplayControls(true);
      }}
      onMouseLeave={() => {
        setDisplayControls(false);
      }}
      id="controls"
      className="w-full h-full flex items-end justify-center relative z-[100]"
    >
      <nav
        className="absolute translate-all duration-500 bg-[#1B1833] rounded-md px-2 py-2 z-[100]"
        style={{
          transform: displayControls ? "translateY(-10%)" : "translateY(100%)",
        }}
      >
        <ul className="flex gap-5">
          <li>
            <button
              className="text-white text-2xl py-4 px-3 hover:bg-[#1E3E62] rounded-md transition-all"
              onClick={handleCameraToggle}
            >
              {userCameraStream ? (
                <FiCamera></FiCamera>
              ) : (
                <FiCameraOff></FiCameraOff>
              )}
            </button>
          </li>
          <li>
            <button
              className="text-white text-2xl py-4 px-3 hover:bg-[#1E3E62] rounded-md transition-all"
              onClick={handleMicrophoneToggle}
            >
              {userMicrophoneStream ? <MdMic></MdMic> : <MdMicOff></MdMicOff>}
            </button>
          </li>
          <li>
            <button
              className={`text-white text-2xl py-4 px-3 hover:bg-[#1E3E62] rounded-md transition-all`}
              onClick={() => {
                setShowExternalMediaModal(true);
              }}
            >
              <RiExternalLinkLine></RiExternalLinkLine>
            </button>
          </li>
          <li>
            <button
              className={`text-white text-2xl py-4 px-3 hover:bg-[#1E3E62] rounded-md transition-all`}
              onClick={() => {
                setOpenLiveChat((v) => !v);
              }}
            >
              <BsChatLeftText></BsChatLeftText>
            </button>
          </li>
          <li>
            <button
              className={`text-white text-2xl py-4 px-3 hover:bg-[#1E3E62] rounded-md transition-all`}
              onClick={toggleDarkMode}
            >
              {darkMode ? <MdOutlineLightMode /> : <MdOutlineDarkMode />}
            </button>
          </li>
          <li>
            <button
              className={`text-white text-2xl py-4 px-3 rounded-md transition-all 
                  ${
                    userDetails.isHost
                      ? "bg-[#FF0B55] hover:bg-[#CF0F47]"
                      : "bg-[#393E46] hover:bg-[#222831]"
                  }`}
              onClick={() => {
                handleExitOrEndRoom(userDetails.isHost);
              }}
            >
              {userDetails.isHost ? (
                <IoCall></IoCall>
              ) : (
                <MdOutlineExitToApp></MdOutlineExitToApp>
              )}
            </button>
          </li>
        </ul>
      </nav>
    </section>
  );
}
