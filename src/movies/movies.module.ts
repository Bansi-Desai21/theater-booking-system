import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { MovieService } from "./movies.service";
import { MovieController } from "./movies.controller";
import { Movie, MovieSchema } from "../../schemas/movies.schema";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }]),
    HttpModule,
    ConfigModule,
    CloudinaryModule,
  ],
  controllers: [MovieController],
  providers: [MovieService],
  exports: [MovieService],
})
export class MovieModule {}
