"use client";
import { roomIdAtom, usernameAtom, userIdAtom } from "@/store";
import {
  ExitParticipantDetails,
  NewParticipantDetails,
  UserDetails,
} from "@/types";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import axios from "axios";

type ResponseType = {
  success: boolean;
  roomId: string;
  message?: string;
  data?: {
    allUserDetails: UserDetails[];
  };
  error?: string;
};

export function useRooms() {
  const [participants, setParticipants] = useState<Map<string, UserDetails>>(
    new Map()
  );
  const [roomId] = useAtom(roomIdAtom);
  const [userId] = useAtom(userIdAtom);
  const [username] = useAtom(usernameAtom);
  const [joinedStatus, setJoinedStatus] = useState<boolean>(false);

  // Send Request to the user to join the room
  useEffect(() => {
    async function joinRoom() {
      const response = (await axios.post(
        `http://localhost:8080/api/v1/room/join-room/${roomId}`,
        {
          userId,
          username,
        }
      )) as Axios.AxiosXHR<ResponseType>;

      console.log("response is", response);

      const allUserDetails = response.data.data?.allUserDetails;

      const allParticipants = new Map<string, UserDetails>();
      allUserDetails?.forEach((ud) => allParticipants.set(ud.userId, ud));

      setParticipants(allParticipants);
      setJoinedStatus(response.data.success);
    }

    if (roomId && username && userId) {
      joinRoom();
    }
  }, [roomId, username, userId]);

  useEffect(() => {
    function handleNewParticipant(event: Event) {
      const customEvent = event as CustomEvent<NewParticipantDetails>;
      const newUserDetails = customEvent.detail.userDetails;

      setParticipants((prevState) => {
        const newState = new Map(prevState);
        newState.set(newUserDetails.userId, newUserDetails);
        return newState;
      });
    }

    function handleParticipantExit(event: Event) {
      const customEvent = event as CustomEvent<ExitParticipantDetails>;

      const exitedUserId = customEvent.detail.userId;

      setParticipants((prevState) => {
        const newState = new Map(prevState);
        newState.delete(exitedUserId);
        return newState;
      });
    }

    window.addEventListener("new-participant", handleNewParticipant);
    window.addEventListener("user-exit-room", handleParticipantExit);

    return () => {
      window.removeEventListener("new-participant", handleNewParticipant);
      window.removeEventListener("user-exit-room", handleParticipantExit);
    };
  }, []);

  useEffect(() => {
    console.log("Room Participants are", participants);
  }, [participants]);

  return {
    joinedStatus,
    participants,
  };
}
