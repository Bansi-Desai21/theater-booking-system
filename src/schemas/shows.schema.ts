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

  @Prop({ required: true, type: Date })
  showDate: Date;

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

  @Prop({ required: false, default: false })
  isRemoved: Boolean;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  createdBy: Types.ObjectId;
}

export const ShowSchema = SchemaFactory.createForClass(Show);
ShowSchema.index({ screenId: 1, showDate: 1, startTime: 1, endTime: 1 }); // Optimized Indexing
