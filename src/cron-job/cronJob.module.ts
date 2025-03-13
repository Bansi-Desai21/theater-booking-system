import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { MovieService } from "../movies/movies.service";
import { CronJobService } from "./cronJob.service";
import { Movie, MovieSchema } from "src/schemas/movies.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { HttpModule } from "@nestjs/axios";
import { CronJobController } from "./cronJob.controller";
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }]),
    HttpModule,
    ScheduleModule.forRoot(),
  ],
  providers: [MovieService, CronJobService],
  controllers: [CronJobController],
})
export class CronJobModule {}
