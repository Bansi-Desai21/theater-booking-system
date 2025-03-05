import { Module } from "@nestjs/common";
import { ScreenController } from "./screen.controller";
import { ScreenService } from "./screen.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Screen, ScreenSchema } from "../schemas/screen.schema";
import { Theater, TheaterSchema } from "src/schemas/theater.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Screen.name, schema: ScreenSchema },
      { name: Theater.name, schema: TheaterSchema },
    ]),
  ],
  controllers: [ScreenController],
  providers: [ScreenService],
})
export class ScreenModule {}
