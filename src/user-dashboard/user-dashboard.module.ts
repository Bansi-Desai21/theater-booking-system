import { Module } from "@nestjs/common";
import { UserDashboardController } from "./user-dashboard.controller";
import { ShowModule } from "../show/show.module";
import { UserDashboardService } from "./user-dashboard.service";
@Module({
  imports: [ShowModule],
  providers: [UserDashboardService],
  controllers: [UserDashboardController],
})
export class UserDashboardModule {}
