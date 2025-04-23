import { RoomDetails, RoomSettings } from "./rooms.types";

export function createRoomDetails(
  userId: string,
  roomName?: string,
  settings: RoomSettings = {}
): RoomDetails {
  return {
    hostId: userId,
    dateCreated: Date.now(),
    active: true,

    name: roomName || "Untitled Room",
    password: null,

    settings: {
      maxParticipants: settings.maxParticipants || 10,
      allowedMedia: {
        video: settings.allowedMedia?.video !== false,
        audio: settings.allowedMedia?.audio !== false,
        screen: settings.allowedMedia?.screen !== false,
      },
      defaultMuted: settings.defaultMuted || false,
      quality: settings.quality || "auto",
    },

    mediaServerId: "", // To be assigned when creating room
    routerId: null,

    participantCount: 1,
    startedAt: Date.now(),
    endedAt: null,

    features: {
      chat: settings.features?.chat !== false,
      reactions: settings.features?.reactions !== false,
    },

    defaultPermissions: {
      canShareVideo: true,
      canShareScreen: settings.permissions?.canShareScreen !== false,
      canChat: settings.permissions?.canChat !== false,
      canReact: settings.permissions?.canReact !== false,
    },
  };
}
