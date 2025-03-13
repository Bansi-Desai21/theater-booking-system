import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type ShowDocument = Show & Document;

export enum ShowStatusEnum {
  ACTIVE = "ACTIVE",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

@Schema({ timestamps: true })
export class Show {
  @Prop({ required: true, type: Types.ObjectId, ref: "Movie", index: true })
  movieId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "Screen", index: true })
  screenId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "Theater", index: true })
  theaterId: Types.ObjectId;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ required: true })
  ticketPrice: number;

  @Prop({
    required: true,
    enum: ShowStatusEnum,
    default: ShowStatusEnum.ACTIVE,
  })
  status: ShowStatusEnum;

  @Prop({ required: false, default: false })
  isRemoved: Boolean;
}

export const ShowSchema = SchemaFactory.createForClass(Show);
