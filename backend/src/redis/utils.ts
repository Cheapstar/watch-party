import { UserDetails } from "./types";

export function createUserDetails(
  userId: string,
  userName: string,
  isHost: boolean
): UserDetails {
  return {
    userId,
    userName,
    isHost,
    joinedAt: Date.now(),
    permissions: {
      canChat: true,
      canKick: isHost,
      canMuteOthers: isHost,
      canPausePlay: isHost,
      canShareScreen: isHost,
      canShareVideo: isHost,
    },
  };
}

export function userDto(usd: UserDetails) {
  return {
    ...usd,
  };
}
