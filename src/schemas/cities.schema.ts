import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class City extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  state: string;
}

export const CitySchema = SchemaFactory.createForClass(City);
