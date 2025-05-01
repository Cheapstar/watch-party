"use client";
import { socketAtom } from "@/store";
import { useAtom } from "jotai";
import { useState } from "react";
import { FaArrowRight } from "react-icons/fa6";

interface props {
  showExternalMediaModal: boolean;
  setShowExternalMediaModal: (v: boolean) => void;
  setExternalMediaUrl: (v: string) => void;
}

export function ExternalMediaModal({
  showExternalMediaModal,
  setShowExternalMediaModal,
  setExternalMediaUrl,
}: props) {
  const [value, setValue] = useState<string>("");
  const [error, setError] = useState<string>();
  const [socket] = useAtom(socketAtom);

  function validateInput(url: string) {
    const regex = /(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? true : false;
  }

  return (
    <>
      {showExternalMediaModal && (
        <div
          onClick={() => {
            setError("");
            setValue("");
            setShowExternalMediaModal(false);
          }}
          className="fixed h-screen w-screen bg-black/20 backdrop-blur-lg flex justify-center items-center z-[1000]"
        >
          <div
            className="flex flex-col w-1/2 bg-[#123458] rounded-md p-10 gap-4 shadow-2xs"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <label
              htmlFor="external-media-url"
              className="text-white"
            >
              Enter Your Url
            </label>
            <input
              name="external-media-url"
              className="bg-white/10 border border-white/20 rounded-md px-4 py-2
             text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="www.youtube.com/watch?v=1WE0p_axTPKJ...."
              value={value}
              onChange={(e) => setValue(e.target.value)}
            ></input>

            <div className="flex justify-end">
              <button
                className="px-4 py-2.5 flex justify-center  bg-gradient-to-r from-cyan-400 to-purple-500
          hover:from-cyan-300 hover:to-purple-400 transition-all text-white font-semibold rounded-md mt-2 cursor-pointer"
                onClick={() => {
                  if (!value) {
                    setError("Input cannot be empty");
                    return;
                  }

                  if (!validateInput(value as string)) {
                    setError("Input is Invalid");
                    return;
                  }

                  setError("");
                  setExternalMediaUrl((value as string).trim());
                  setShowExternalMediaModal(false);
                  if (socket) {
                    socket.send("external-media", {
                      url: value.trim(),
                    });
                  }
                }}
              >
                <span className="rotate-90  animate-bounce duration-75">
                  <FaArrowRight className="text-lg -rotate-90"></FaArrowRight>
                </span>
              </button>
            </div>
            {error && <p className="text-red-500">*{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
