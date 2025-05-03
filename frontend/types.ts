export interface RoomDetails {
  // Essential room identification
  hostId: string; // ID of the room creator/host
  dateCreated: number; // Timestamp when room was created
  active: boolean; // Whether the room is active or ended

  // Room configuration
  name: string; // Display name of the room
  password: string | null; // Optional password protection

  // Media settings
  settings: {
    maxParticipants: number;
    allowedMedia: {
      video: boolean;
      audio: boolean;
      screen: boolean;
    };
    defaultMuted: boolean;
    quality: "low" | "medium" | "high" | "auto";
  };

  // Room state
  participantCount: number; // Current number of participants
  startedAt: number | null; // When actual session began
  endedAt: number | null; // When room was closed

  // Optional features
  features: {
    chat: boolean;
    reactions: boolean;
    // raiseHand: boolean;
  };

  externalMedia: string;
}

export interface UserDetails {
  userId: string;
  userName: string;
  isHost: boolean;
  joinedAt: number;
  permissions: {
    canShareVideo: boolean;
    canShareScreen: boolean;
    canChat: boolean;
    canMuteOthers: boolean;
    canKick: boolean;
    canPausePlay: boolean;
  };
}

export type MessageType = {
  id: string;
  senderId: string;
  roomId: string;
  content: string;
  createdAt: number;
};

// mediasoup
export type RemoteMedia = {
  from: string;
  fromusername: string;
  camera?: MediaStreamTrack;
  microphone?: MediaStreamTrack;
  screen?: MediaStreamTrack;
  screenAudio?: MediaStreamTrack;
};

// Custom Events
export type NewParticipantDetails = {
  userDetails: UserDetails;
};

export type ExitParticipantDetails = {
  userId: string;
};
