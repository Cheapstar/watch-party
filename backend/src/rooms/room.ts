import { Router } from "mediasoup/node/lib/RouterTypes";
import { Participant } from "./participant/participant";

export class Room {
  public router: Router;
  public roomId: string;
  public participants: Map<string, Participant> = new Map();

  constructor(router: Router, roomId: string) {
    this.router = router;
    this.roomId = roomId;
  }

  getRouter = () => {
    this.ensureRouterInitialised();

    return this.router;
  };

  saveParticipant = (participant: Participant, userId: string) => {
    if (this.participants.has(userId)) return;
    this.participants.set(userId, participant);
  };

  ensureRouterInitialised = () => {
    if (!this.router) {
      console.log(
        `Router for the Room with roomId:${this.roomId} is not initialized`
      );
      throw new Error(
        `Router for the Room with roomId:${this.roomId} is not initialized`
      );
    }
  };

  removeParticipant = (userId: string) => {
    if (!this.participants.has(userId)) return;

    const participant = this.participants.get(userId) as Participant;
    participant.close();

    this.participants.delete(userId);
  };

  removeAllParticpants = () => {
    const participants = Array.from(this.participants.keys());
    participants.forEach((p) => this.removeParticipant(p));
  };

  closeRoom = () => {
    this.removeAllParticpants();
    this.router.close();
  };

  getAllParticipant = () => {
    Array.from(this.participants.keys());
  };
}
