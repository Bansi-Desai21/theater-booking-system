import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "./auth/auth.module";
import { AuthMiddleware } from "./middlewares/auth.middleware";
import { CloudinaryModule } from "./cloudinary/cloudinary.module";
import { UploadMiddleware } from "./middlewares/upload.middleware";
import { TheaterModule } from "./theater/theater.module";
import { CityModule } from "./cities/cities.module";
import { ScreenModule } from "./screen/screen.module";
import { MovieModule } from "./movies/movies.module";
import { ShowModule } from "./show/show.module";
import { CronJobModule } from "./cron-job/cronJob.module";
import { SeatLayoutModule } from "./seat-layout/seat-layout.module";
import { UserDashboardModule } from "./user-dashboard/user-dashboard.module";
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI as string),
    AuthModule,
    CloudinaryModule,
    TheaterModule,
    CityModule,
    ScreenModule,
    MovieModule,
    ShowModule,
    SeatLayoutModule,
    CronJobModule,
    UserDashboardModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UploadMiddleware)
      .forRoutes(
        {
          path: "auth/update-profile",
          method: RequestMethod.PUT,
        },
        {
          path: "theaters/add-theater",
          method: RequestMethod.POST,
        },
        {
          path: "theaters/update-theater/:id",
          method: RequestMethod.PATCH,
        },
        {
          path: "movies/update-movie/:id",
          method: RequestMethod.PUT,
        }
      )
      .apply(AuthMiddleware)
      .exclude(
        { path: "auth/register", method: RequestMethod.POST },
        { path: "auth/login", method: RequestMethod.POST },
        { path: "auth/request-reset", method: RequestMethod.POST },
        { path: "auth/verify-reset-token/:token", method: RequestMethod.GET },
        { path: "auth/set-password", method: RequestMethod.POST },
        { path: "cities/list-cities", method: RequestMethod.GET },
        { path: "cron/sync", method: RequestMethod.GET },
        { path: "cron/delete-movies", method: RequestMethod.GET },
        { path: "user-dashboard/list-shows", method: RequestMethod.GET },
        { path: "movies/list", method: RequestMethod.GET },
        {
          path: "user-dashboard/get-screen-details/:id",
          method: RequestMethod.GET,
        },
        { path: "user-dashboard/list/:theaterId", method: RequestMethod.GET },
        {
          path: "user-dashboard/seat-layout/:screenId",
          method: RequestMethod.GET,
        }
      )
      .forRoutes("*");
  }
}
