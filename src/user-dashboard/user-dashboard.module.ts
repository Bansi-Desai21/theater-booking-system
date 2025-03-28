import { Module } from "@nestjs/common";
import { UserDashboardController } from "./user-dashboard.controller";
import { ShowModule } from "../show/show.module";
import { UserDashboardService } from "./user-dashboard.service";
import { Theater, TheaterSchema } from "../../schemas/theater.schema";
import { MongooseModule } from "@nestjs/mongoose";
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Theater.name, schema: TheaterSchema }]),
    ShowModule,
  ],
  providers: [UserDashboardService],
  controllers: [UserDashboardController],
})
export class UserDashboardModule {}
