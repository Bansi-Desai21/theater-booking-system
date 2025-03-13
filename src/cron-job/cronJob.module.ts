import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { MovieService } from "../movies/movies.service";
import { CronJobService } from "./cronJob.service";
import { Movie, MovieSchema } from "../schemas/movies.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { HttpModule } from "@nestjs/axios";
import { CronJobController } from "./cronJob.controller";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }]),
    HttpModule,
    ScheduleModule.forRoot(),
    CloudinaryModule,
  ],
  providers: [MovieService, CronJobService],
  controllers: [CronJobController],
})
export class CronJobModule {}
