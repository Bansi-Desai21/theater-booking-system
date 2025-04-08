import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type BookingDocument = Booking & Document;

@Schema({ timestamps: true })
export class Booking {
  @Prop({ required: true, type: Types.ObjectId, ref: "User" })
  userId: Types.ObjectId;

  @Prop({ required: true, type: [{ type: Types.ObjectId, ref: "SeatLayout" }] })
  seatIds: Types.ObjectId[];

  @Prop({ required: true, type: Types.ObjectId, ref: "Screen" })
  screenId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "Theater" })
  theaterId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "SeatLayout" })
  seatLayoutId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "Show" })
  showId: Types.ObjectId;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ default: Date.now })
  bookedAt: Date;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
