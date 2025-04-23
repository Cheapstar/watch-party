"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoomDetails = createRoomDetails;
function createRoomDetails(userId, roomName, settings = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    return {
        hostId: userId,
        dateCreated: Date.now(),
        active: true,
        name: roomName || "Untitled Room",
        password: null,
        settings: {
            maxParticipants: settings.maxParticipants || 10,
            allowedMedia: {
                video: ((_a = settings.allowedMedia) === null || _a === void 0 ? void 0 : _a.video) !== false,
                audio: ((_b = settings.allowedMedia) === null || _b === void 0 ? void 0 : _b.audio) !== false,
                screen: ((_c = settings.allowedMedia) === null || _c === void 0 ? void 0 : _c.screen) !== false,
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
            chat: ((_d = settings.features) === null || _d === void 0 ? void 0 : _d.chat) !== false,
            reactions: ((_e = settings.features) === null || _e === void 0 ? void 0 : _e.reactions) !== false,
        },
        defaultPermissions: {
            canShareVideo: true,
            canShareScreen: ((_f = settings.permissions) === null || _f === void 0 ? void 0 : _f.canShareScreen) !== false,
            canChat: ((_g = settings.permissions) === null || _g === void 0 ? void 0 : _g.canChat) !== false,
            canReact: ((_h = settings.permissions) === null || _h === void 0 ? void 0 : _h.canReact) !== false,
        },
    };
}
