"use client";
import { roomIdAtom, userIdAtom, usernameAtom } from "@/store";
import { useAtom } from "jotai";
import { useParams } from "next/navigation";
import { useState } from "react";

interface props {
  darkMode: boolean;
}

export function JoinRoomModal({ darkMode }: props) {
  const [inputName, setInputName] = useState<string>("");
  const [, setUserId] = useAtom(userIdAtom);
  const [, setUsername] = useAtom(usernameAtom);
  const [, setRoomId] = useAtom(roomIdAtom);
  const params = useParams();

  const styles = darkMode ? "bg-[#1E293B]" : "bg-[#F8FAFC]";
  const textColor = darkMode ? "text-white" : "text-gray-900";

  return (
    <section className="fixed h-screen w-screen bg-[#1E293B] flex justify-center items-center z-[10]">
      <form
        className={`${styles} rounded-2xl shadow-lg p-10 w-full max-w-md`}
        onSubmit={(e) => {
          e.preventDefault();
          setUsername(inputName.trim());
          setUserId(crypto.randomUUID());
          const roomId = params.roomId;
          setRoomId(roomId as string);
        }}
      >
        <h2 className={`text-2xl font-bold mb-6 text-center ${textColor}`}>
          Join Room
        </h2>

        <div className="mb-4">
          <label
            htmlFor="username"
            className={`block mb-2 text-sm font-medium ${textColor}`}
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            className={`text-white w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            required
          />
        </div>

        <button
          type="submit"
          className={`w-full bg-blue-600 hover:bg-blue-700 ${textColor} font-semibold py-2 px-4 rounded-md transition duration-200`}
        >
          Join Room
        </button>
      </form>
    </section>
  );
}
