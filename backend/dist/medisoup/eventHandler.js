"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediasoupEventHandler = mediasoupEventHandler;
function mediasoupEventHandler({ event, payload, ws, }) {
    const type = event.split("-")[1];
    switch (type) {
        case "sendRtpCapabilities":
    }
}
