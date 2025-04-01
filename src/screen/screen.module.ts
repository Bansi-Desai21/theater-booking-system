import { Module } from "@nestjs/common";
import { ScreenController } from "./screen.controller";
import { ScreenService } from "./screen.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Screen, ScreenSchema } from "../../schemas/screen.schema";
import { Theater, TheaterSchema } from "../../schemas/theater.schema";
import { Show, ShowSchema } from "../../schemas/shows.schema";
import { SeatLayout, SeatLayoutSchema } from "../../schemas/seat-layout.schema";
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Screen.name, schema: ScreenSchema },
      { name: Theater.name, schema: TheaterSchema },
      { name: Show.name, schema: ShowSchema },
      { name: SeatLayout.name, schema: SeatLayoutSchema },
    ]),
  ],
  controllers: [ScreenController],
  providers: [ScreenService],
  exports: [ScreenService],
})
export class ScreenModule {}
