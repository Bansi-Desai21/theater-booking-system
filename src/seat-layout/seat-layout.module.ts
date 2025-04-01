import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SeatLayout, SeatLayoutSchema } from "schemas/seat-layout.schema";
import { SeatLayoutController } from "./seat-layout.controller";
import { SeatLayoutService } from "./seat-layout.service";
import { Screen, ScreenSchema } from "../../schemas/screen.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SeatLayout.name, schema: SeatLayoutSchema },
      { name: Screen.name, schema: ScreenSchema },
    ]),
  ],

  providers: [SeatLayoutService],
  controllers: [SeatLayoutController],
  exports: [SeatLayoutService],
})
export class SeatLayoutModule {}
