"use client";
import { roomIdAtom, userIdAtom, usernameAtom } from "@/store";
import { useAtom } from "jotai";
import { useParams } from "next/navigation";
import { useState } from "react";

export function JoinRoomModal() {
  const [inputName, setInputName] = useState<string>("");
  const [, setUserId] = useAtom(userIdAtom);
  const [, setUsername] = useAtom(usernameAtom);
  const [, setRoomId] = useAtom(roomIdAtom);
  const params = useParams();

  return (
    <section className="h-screen w-screen bg-black flex justify-center items-center">
      <form
        className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          setUsername(inputName.trim());
          setUserId(crypto.randomUUID());
          const roomId = params.roomId;
          setRoomId(roomId as string);
        }}
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Join Room
        </h2>

        <div className="mb-4">
          <label
            htmlFor="username"
            className="block mb-2 text-sm font-medium text-gray-700"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
        >
          Join Room
        </button>
      </form>
    </section>
  );
}
