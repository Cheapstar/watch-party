import { WebSocketClient } from "../websocket/websocketclient";

export function mediasoupEventHandler({
  event,
  payload,
  ws,
}: {
  event: string;
  payload: unknown;
  ws: WebSocketClient;
}) {
  const type = event.split("-")[1];
  switch (type) {
    case "sendRtpCapabilities":
  }
}
