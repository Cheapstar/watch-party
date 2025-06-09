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
import { PrimaryButton } from "./PrimaryButton";

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

  const styles = darkMode ? "bg-[#1E293B]" : "bg-[#FFFFFF]";

  return (
    <section
      onMouseEnter={() => setDisplayControls(true)}
      onMouseLeave={() => setDisplayControls(false)}
      id="controls"
      className="w-full h-full flex items-end justify-center relative z-[100] "
    >
      <nav
        className={`absolute transition-all duration-500 rounded-md px-2 py-2 z-[100] ${styles} shadow-lg`}
        style={{
          transform: displayControls ? "translateY(-10%)" : "translateY(100%)",
        }}
      >
        <ul className="flex gap-5 items-center">
          <li>
            <PrimaryButton
              clickHandler={handleCameraToggle}
              darkMode={darkMode}
            >
              {userCameraStream ? (
                <FiCamera className="text-2xl" />
              ) : (
                <FiCameraOff className="text-2xl" />
              )}
            </PrimaryButton>
          </li>

          <li>
            <PrimaryButton
              clickHandler={handleMicrophoneToggle}
              darkMode={darkMode}
            >
              {userMicrophoneStream ? (
                <MdMic className="text-2xl" />
              ) : (
                <MdMicOff className="text-2xl" />
              )}
            </PrimaryButton>
          </li>

          <li>
            <PrimaryButton
              clickHandler={() => setShowExternalMediaModal(true)}
              darkMode={darkMode}
            >
              <RiExternalLinkLine className="text-2xl" />
            </PrimaryButton>
          </li>

          <li>
            <PrimaryButton
              clickHandler={() => setOpenLiveChat((v) => !v)}
              darkMode={darkMode}
            >
              <BsChatLeftText className="text-2xl" />
            </PrimaryButton>
          </li>

          <li>
            <PrimaryButton
              clickHandler={toggleDarkMode}
              darkMode={darkMode}
            >
              {darkMode ? (
                <MdOutlineLightMode className="text-2xl" />
              ) : (
                <MdOutlineDarkMode className="text-2xl" />
              )}
            </PrimaryButton>
          </li>

          <li>
            <PrimaryButton
              clickHandler={() => handleExitOrEndRoom(userDetails.isHost)}
              darkMode={darkMode}
            >
              {userDetails.isHost ? (
                <IoCall className="text-2xl" />
              ) : (
                <MdOutlineExitToApp className="text-2xl" />
              )}
            </PrimaryButton>
          </li>
        </ul>
      </nav>
    </section>
  );
}
