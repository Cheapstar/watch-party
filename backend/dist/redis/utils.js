export function createUserDetails(userId, userName, isHost) {
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
export function userDto(usd) {
    return {
        ...usd,
    };
}
