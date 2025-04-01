import { Module } from "@nestjs/common";
import { UserDashboardController } from "./user-dashboard.controller";
import { ShowModule } from "../show/show.module";
import { UserDashboardService } from "./user-dashboard.service";
import { Theater, TheaterSchema } from "../../schemas/theater.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { ScreenModule } from "../screen/screen.module";
import { SeatLayoutModule } from "../seat-layout/seat-layout.module";
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Theater.name, schema: TheaterSchema }]),
    ShowModule,
    ScreenModule,
    SeatLayoutModule,
  ],
  providers: [UserDashboardService],
  controllers: [UserDashboardController],
})
export class UserDashboardModule {}
