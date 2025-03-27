import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  mobile: number;

  @Prop({ required: false })
  password: string;

  @Prop({ required: true, default: "customer" })
  role: string;

  @Prop({ required: false })
  image: string;

  @Prop({ required: false, default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
