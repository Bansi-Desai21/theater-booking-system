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
  @Prop({ required: true, type: Types.ObjectId, ref: "Movie" })
  movieId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "Screen" })
  screenId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "Theater" })
  theaterId: Types.ObjectId;

  @Prop({ required: true, type: Date })
  showDate: Date;

  @Prop({ required: true, type: Date })
  showEndDate: Date;

  @Prop({ required: true, type: Date })
  startTime: Date;

  @Prop({ required: true, type: Date })
  endTime: Date;

  @Prop({ required: true })
  ticketPrice: number;

  @Prop({
    required: true,
    enum: ShowStatusEnum,
    default: ShowStatusEnum.ACTIVE,
  })
  status: ShowStatusEnum;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  createdBy: Types.ObjectId;
}

export const ShowSchema = SchemaFactory.createForClass(Show);
