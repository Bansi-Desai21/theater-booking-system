import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { City, CitySchema } from "../schemas/cities.schema";
import { CitiesService } from "./cities.service";
import { CityController } from "./cities.controller";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: City.name, schema: CitySchema }]),
  ],
  controllers: [CityController],
  providers: [CitiesService],
})
export class CityModule {}
