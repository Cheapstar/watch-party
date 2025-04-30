"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserDetails = createUserDetails;
exports.userDto = userDto;
function createUserDetails(userId, userName, isHost) {
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
function userDto(usd) {
    return Object.assign({}, usd);
}
