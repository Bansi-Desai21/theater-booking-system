import { Module } from '@nestjs/common';
import { UserDashboardController } from './user-dashboard.controller';

@Module({
  controllers: [UserDashboardController]
})
export class UserDashboardModule {}
