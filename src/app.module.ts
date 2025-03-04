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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI as string),
    AuthModule,
    CloudinaryModule,
    TheaterModule,
    CityModule,
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
        }
      )
      .apply(AuthMiddleware)
      .exclude(
        { path: "auth/register", method: RequestMethod.POST },
        { path: "auth/login", method: RequestMethod.POST },
        { path: "auth/request-reset", method: RequestMethod.POST },
        { path: "auth/verify-reset-token/:token", method: RequestMethod.GET },
        { path: "auth/set-password", method: RequestMethod.POST },
        { path: "cities/list-cities", method: RequestMethod.GET }
      )
      .forRoutes("*");
  }
}
