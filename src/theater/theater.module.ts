import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TheaterController } from "./theater.controller";
import { TheaterService } from "./theater.service";
import { TheaterSchema } from "../schemas/theater.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Theater", schema: TheaterSchema }]),
  ],
  controllers: [TheaterController],
  providers: [TheaterService],
})
export class TheaterModule {}
