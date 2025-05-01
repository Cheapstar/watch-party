// Type definitions for Room Details

// Room settings interface
export interface RoomSettings {
  maxParticipants?: number;
  allowedMedia?: {
    video: boolean;
    audio: boolean;
    screen: boolean;
  };
  defaultMuted?: boolean;
  quality?: "low" | "medium" | "high" | "auto";
  features?: {
    chat?: boolean;
    reactions?: boolean;
    // raiseHand?: boolean;
  };
  permissions?: {
    canShareVideo?: boolean;
    canShareScreen?: boolean;
    canChat?: boolean;
    canReact?: boolean;
  };
}

// Room details interface
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

  // MediaSoup specific data , Ye hai Scaling k liye
  mediaServerId: string | null; // ID of the MediaSoup worker handling this room
  routerId: string | null; // To be filled when MediaSoup router is created

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

  // Permissions model
  defaultPermissions: {
    canShareVideo: boolean;
    canShareScreen: boolean;
    canChat: boolean;
    canReact: boolean;
  };

  externalMedia?: string;
}
