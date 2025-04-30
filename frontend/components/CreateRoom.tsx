"use client";

import { useState } from "react";
import { CgSpinnerAlt } from "react-icons/cg";
import {
  roomIdAtom,
  roomnameAtom,
  userIdAtom,
  usernameAtom,
  isHostAtom,
} from "@/store";
import { useAtom } from "jotai";
import { useForm } from "react-hook-form";
import axios from "axios";
import { redirect } from "next/navigation";

type Inputs = {
  username: string;
  roomname: string;
};

type ResponseType = {
  success: boolean;
  roomId: string;
  message?: string;
  error?: string;
};

export function CreateRoom() {
  const { register, handleSubmit } = useForm<Inputs>({
    defaultValues: {
      username: "",
      roomname: "",
    },
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [, setUserId] = useAtom(userIdAtom);
  const [, setRoomId] = useAtom(roomIdAtom);
  const [, setRoomname] = useAtom(roomnameAtom);
  const [, setUsername] = useAtom(usernameAtom);
  const [, setIsHost] = useAtom(isHostAtom);

  async function onSubmit(data: Inputs) {
    setLoading(true);

    const id = crypto.randomUUID();
    setUserId(id);
    setRoomname(data.roomname);
    setUsername(data.username);
    setIsHost(true);

    const response = await axios.post(
      "http://localhost:8080/api/v1/room/create-room",
      {
        userId: id,
        username: data.username,
        roomname: data.roomname,
      }
    );

    const { data: resData } = response as Axios.AxiosXHR<ResponseType>;
    if (resData.success) {
      /* Save thr roomId and then move to the different window , show toast also */
      console.log("Sucessfull", resData);
      setRoomId(resData.roomId);
      /*
        Create the RoomDetails {} 

      */

      redirect(`http://localhost:3000/room/${resData.roomId}`);
    } else {
      console.log("Sorry Could not create the room");
    }

    setLoading(false);
  }

  return (
    <main
      className="h-screen w-full flex justify-center items-center"
      style={{
        background: 'url("./watch-bg.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <form
        className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-8 w-full max-w-md flex flex-col gap-6 shadow-2xl"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h1 className="text-white text-2xl font-bold text-center">
          Create a Room
        </h1>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="username"
            className="text-sm text-white font-medium"
          >
            Enter Your Name
          </label>
          <input
            id="username"
            type="text"
            className="bg-white/10 border border-white/20 rounded-md
             px-4 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            placeholder="John Doe"
            {...register("username", {
              required: true,
            })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="roomname"
            className="text-sm text-white font-medium"
          >
            Enter the Room Name
          </label>
          <input
            id="roomname"
            type="text"
            className="bg-white/10 border border-white/20 rounded-md px-4 py-2
             text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            placeholder="untitled"
            {...register("roomname", {
              required: true,
            })}
          />
        </div>

        <div className="flex relative">
          <div className="absolute"></div>
          <button
            className="grow flex justify-center  bg-gradient-to-r from-cyan-400 to-purple-500
          hover:from-cyan-300 hover:to-purple-400 transition-all text-white font-semibold py-2 rounded-md mt-2
          "
          >
            {loading ? (
              <CgSpinnerAlt className="animate-spin font-semibold text-2xl"></CgSpinnerAlt>
            ) : (
              "Create Room"
            )}
          </button>
        </div>
      </form>
    </main>
  );
}
