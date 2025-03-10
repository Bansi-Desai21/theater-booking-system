import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type TheaterDocument = Theater & Document;

@Schema({ timestamps: true })
export class Theater {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  location: string;

  @Prop({ type: Types.ObjectId, ref: "City", required: true })
  city: Types.ObjectId;

  @Prop({ required: true })
  no_of_screens: number;

  @Prop({ required: false })
  image: string;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  ownerId: Types.ObjectId;

  @Prop({ default: true })
  isActive: Boolean;

  @Prop({ default: false })
  isRemoved: Boolean;
}

export const TheaterSchema = SchemaFactory.createForClass(Theater);
