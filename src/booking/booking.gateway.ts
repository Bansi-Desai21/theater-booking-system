import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server } from "socket.io";
import { Injectable } from "@nestjs/common";

@Injectable()
@WebSocketGateway({ cors: true })
export class BookingGateway implements OnGatewayConnection {
  handleConnection(client: any, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
    this.server.emit("client_connected", { clientId: client.id });
  }
  @WebSocketServer()
  server: Server;

  private heldSeats = new Map<string, NodeJS.Timeout>();

  @SubscribeMessage("hold_seat")
  handleHoldSeat(@MessageBody() data: { seatId: string; userId: string }) {
    if (this.heldSeats.has(data.seatId)) {
      this.server.emit("seat_hold_failed", data.seatId);
      return;
    }

    const timeout = setTimeout(() => {
      this.heldSeats.delete(data.seatId);
      this.server.emit("seat_released", data.seatId);
    }, 300000);

    this.heldSeats.set(data.seatId, timeout);
    this.server.emit("seat_held", { seatId: data.seatId, userId: data.userId });
  }

  @SubscribeMessage("release_seat")
  handleReleaseSeat(@MessageBody() data: { seatId: string }) {
    const timeout = this.heldSeats.get(data.seatId);
    if (timeout) {
      clearTimeout(timeout);
      this.heldSeats.delete(data.seatId);
      this.server.emit("seat_released", data.seatId);
    }
  }

  emitSeatBooked(seatId: string) {
    this.server.emit("seat_booked", { seatId });
  }
}
