import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class PasswordReset extends Document {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true, expires: 3600 })
  expiresAt: Date;
}

export const PasswordResetSchema = SchemaFactory.createForClass(PasswordReset);
