import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TheaterController } from "./theater.controller";
import { TheaterService } from "./theater.service";
import { Theater, TheaterSchema } from "../../schemas/theater.schema";
import { User, UserSchema } from "../../schemas/user.schema";
import { Screen, ScreenSchema } from "../../schemas/screen.schema";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";
import { Show, ShowSchema } from "../../schemas/shows.schema";
import { SeatLayout, SeatLayoutSchema } from "../../schemas/seat-layout.schema";
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Theater.name, schema: TheaterSchema },
      { name: User.name, schema: UserSchema },
      { name: Screen.name, schema: ScreenSchema },
      { name: Show.name, schema: ShowSchema },
      { name: SeatLayout.name, schema: SeatLayoutSchema },
    ]),
    CloudinaryModule,
  ],
  controllers: [TheaterController],
  providers: [TheaterService],
})
export class TheaterModule {}
