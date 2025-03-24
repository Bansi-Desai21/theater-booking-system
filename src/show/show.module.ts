import { Module } from "@nestjs/common";
import { ShowService } from "./show.service";
import { ShowController } from "./show.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { Show, ShowSchema } from "../schemas/shows.schema";
import { Theater, TheaterSchema } from "../schemas/theater.schema";
import { Movie, MovieSchema } from "../schemas/movies.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Show.name, schema: ShowSchema },
      { name: Theater.name, schema: TheaterSchema },
      { name: Movie.name, schema: MovieSchema },
    ]),
  ],
  providers: [ShowService],
  controllers: [ShowController],
})
export class ShowModule {}
