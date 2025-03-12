import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type MovieDocument = Movie & Document;

class CastMember {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  character: string;

  @Prop({ required: false })
  profilePath: string;
}

class CrewMember {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  job: string;

  @Prop({ required: false })
  profilePath: string;
}

class Video {
  @Prop({ required: true })
  key: string; // YouTube video key
  @Prop({ required: true })
  name: string;
  @Prop({ required: true })
  site: string;
  @Prop({ required: true })
  type: string; // Trailer or Teaser
}

@Schema({ timestamps: true })
export class Movie {
  @Prop({ required: true, unique: true })
  tmdbId: number;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  languages: string[]; // Support multiple languages

  @Prop({ required: false })
  genres: string[];

  @Prop({ required: true })
  duration: number; // Duration in minutes

  @Prop({ required: false })
  releaseDate: Date;

  @Prop({ required: false })
  posterUrl: string;

  @Prop({ required: false })
  backdropUrl: string;

  @Prop({ required: false })
  overview: string;

  @Prop({ required: false })
  rating: number;

  @Prop({
    type: [String],
    enum: ["Now Showing", "Upcoming"],
    default: [],
  })
  categories: string[];

  @Prop({ type: [CastMember], required: false })
  cast: CastMember[];

  @Prop({ type: [CrewMember], required: false })
  crew: CrewMember[];

  @Prop({ type: [Video], required: false })
  videos: Video[];
}

export const MovieSchema = SchemaFactory.createForClass(Movie);
