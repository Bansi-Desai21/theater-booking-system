import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types, Document } from "mongoose";
import { SeatType } from "../src/utils/seats.enum";

export type SeatLayoutDocument = SeatLayout & Document;

@Schema({ timestamps: true })
export class SeatLayout {
  @Prop({ type: Types.ObjectId, ref: "Screen", required: true })
  screenId: string;

  @Prop({ type: Types.ObjectId, ref: "Theater", required: true })
  theaterId: string;

  @Prop({ required: true })
  rows: number;

  @Prop({ required: true })
  cols: number;

  @Prop({ required: true })
  defaultRegularPrice: number;

  @Prop({
    type: [
      {
        row: { type: String, required: true },
        seatNumber: { type: Number, required: true },
        type: {
          type: String,
          enum: Object.values(SeatType),
          default: SeatType.REGULAR,
        },
        price: { type: Number, required: true },
        isAvailable: { type: Boolean, default: true },
        isBooked: { type: Boolean, default: false },
      },
    ],
    default: [],
  })
  seats: {
    row: string;
    seatNumber: number;
    type: SeatType;
    price: number;
    isAvailable: boolean;
    isBooked: boolean;
  }[];
}

export const SeatLayoutSchema = SchemaFactory.createForClass(SeatLayout);
