// User details interface
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
