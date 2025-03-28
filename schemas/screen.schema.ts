import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

export type ScreenDocument = Screen & Document;

@Schema({ timestamps: true })
export class Screen {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  totalSeats: number;

  @Prop({ type: Types.ObjectId, ref: "Theater" })
  theaterId: string;

  @Prop({ default: false })
  isRemoved: Boolean;

  @Prop({ default: true })
  isActive: Boolean;

  @Prop({ default: false })
  isComplete: Boolean;

  @Prop({ type: Types.ObjectId, ref: "SeatLayout" })
  seatLayoutId: string;
}

export const ScreenSchema = SchemaFactory.createForClass(Screen);
