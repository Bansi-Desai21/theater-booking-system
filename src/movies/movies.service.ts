import { HttpService } from "@nestjs/axios";
import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { firstValueFrom } from "rxjs";
import { Movie, MovieDocument } from "../schemas/movies.schema";
import {
  createResponse,
  EnhancedHttpException,
} from "../utils/helper.response.function";
import * as moment from "moment";

@Injectable()
export class MovieService {
  private readonly logger = new Logger(MovieService.name);
  private TMDB_API_URL: string;
  private TMDB_API_KEY: string;
  private readonly VALID_LANGUAGES = ["en", "hi", "gu"];
  private readonly VALID_VIDEO_LANGUAGES = ["en", "hi"];

  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Movie.name) private movieModel: Model<MovieDocument>
  ) {
    this.TMDB_API_URL = process.env.TMDB_API_URL || "";
    this.TMDB_API_KEY = process.env.TMDB_API_KEY || "";
  }

  async syncMovies(path: string) {
    try {
      await Promise.all([this.syncNowShowing(), this.syncUpcoming()]);

      return createResponse(200, true, "Movies synced successfully.", null);
    } catch (error) {
      throw new EnhancedHttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || "Internal Server Error",
          path: path,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private async syncNowShowing() {
    const today = moment();
    const sixtyDaysAgo = moment().subtract(60, "days");
    let page = 1;
    let totalPages = 1;

    this.logger.log("Starting sync for Now Showing movies...");

    while (page <= totalPages) {
      const url = `${this.TMDB_API_URL}/movie/now_playing?api_key=${this.TMDB_API_KEY}&region=IN&page=${page}`;
      const response = await firstValueFrom(this.httpService.get(url));
      const movies = response.data.results;
      totalPages = response.data.total_pages;

      for (const movie of movies) {
        if (!this.isValidLanguage(movie.original_language)) continue;
        if (!movie.release_date) continue;

        const releaseDate = moment(movie.release_date);
        if (releaseDate.isBefore(sixtyDaysAgo) || releaseDate.isAfter(today)) {
          this.logger.warn(
            `Skipping old movie in list: ${movie.title} (${movie.release_date})`
          );
          continue;
        }

        const details = await this.fetchMovieDetails(movie.id);

        // Double-check release date in details
        const detailedReleaseDate = moment(details.release_date);
        if (
          detailedReleaseDate.isBefore(sixtyDaysAgo) ||
          detailedReleaseDate.isAfter(today)
        ) {
          this.logger.warn(
            `Skipping after detail check: ${details.title} (${details.release_date})`
          );
          continue;
        }

        await this.upsertMovie(details, { isNowShowing: true });
      }

      this.logger.log(`Now Showing - Processed page ${page} of ${totalPages}`);
      page++;
    }

    this.logger.log("Completed sync for Now Showing movies.");
  }

  private async syncUpcoming() {
    const today = moment();
    let page = 1;
    let totalPages = 1;

    this.logger.log("Starting sync for Upcoming movies...");

    while (page <= totalPages) {
      const url = `${this.TMDB_API_URL}/movie/upcoming?api_key=${this.TMDB_API_KEY}&region=IN&page=${page}`;
      const response = await firstValueFrom(this.httpService.get(url));
      const movies = response.data.results;
      totalPages = response.data.total_pages;

      for (const movie of movies) {
        if (!this.isValidLanguage(movie.original_language)) continue;
        if (!movie.release_date) continue;

        const releaseDate = moment(movie.release_date);
        if (releaseDate.isBefore(today)) {
          this.logger.warn(
            `Skipping past movie in list: ${movie.title} (${movie.release_date})`
          );
          continue;
        }

        const details = await this.fetchMovieDetails(movie.id);

        // Double-check release date in details
        const detailedReleaseDate = moment(details.release_date);
        if (detailedReleaseDate.isBefore(today)) {
          this.logger.warn(
            `Skipping after detail check: ${details.title} (${details.release_date})`
          );
          continue;
        }

        await this.upsertMovie(details, { isUpcoming: true });
      }

      this.logger.log(`Upcoming - Processed page ${page} of ${totalPages}`);
      page++;
    }

    this.logger.log("Completed sync for Upcoming movies.");
  }

  private isValidLanguage(language: string) {
    return this.VALID_LANGUAGES.includes(language);
  }

  private async fetchMovieDetails(movieId: number) {
    const url = `${this.TMDB_API_URL}/movie/${movieId}?api_key=${this.TMDB_API_KEY}&append_to_response=credits`;
    const response = await firstValueFrom(this.httpService.get(url));
    return response.data;
  }

  private async upsertMovie(details: any, flags: Partial<Movie>) {
    const cast = details.credits?.cast.slice(0, 10).map((member) => ({
      name: member.name,
      character: member.character,
      profilePath: member.profile_path,
    }));

    const crew = details.credits?.crew
      .filter((member) =>
        ["Director", "Producer", "Writer"].includes(member.job)
      )
      .map((member) => ({
        name: member.name,
        job: member.job,
        profilePath: member.profile_path,
      }));

    // Filter YouTube videos and valid languages only
    const youtubeVideos = details.videos?.results.filter(
      (video) =>
        video.site === "YouTube" &&
        this.VALID_VIDEO_LANGUAGES.includes(video.iso_639_1)
    );

    let latestTrailer: { key: any; name: any; site: any; type: any } | null =
      null;
    let latestTeaser: { key: any; name: any; site: any; type: any } | null =
      null;

    if (youtubeVideos && youtubeVideos.length > 0) {
      const trailers = youtubeVideos
        .filter((video) => video.type === "Trailer")
        .sort(
          (a, b) =>
            new Date(b.published_at).getTime() -
            new Date(a.published_at).getTime()
        );

      if (trailers.length > 0) {
        latestTrailer = {
          key: trailers[0].key,
          name: trailers[0].name,
          site: trailers[0].site,
          type: trailers[0].type,
        };
      }

      const teasers = youtubeVideos
        .filter((video) => video.type === "Teaser")
        .sort(
          (a, b) =>
            new Date(b.published_at).getTime() -
            new Date(a.published_at).getTime()
        );

      if (teasers.length > 0) {
        latestTeaser = {
          key: teasers[0].key,
          name: teasers[0].name,
          site: teasers[0].site,
          type: teasers[0].type,
        };
      }
    }

    const selectedVideos: {
      key: string;
      name: string;
      site: string;
      type: string;
    }[] = [];
    if (latestTrailer) selectedVideos.push(latestTrailer);
    if (latestTeaser) selectedVideos.push(latestTeaser);

    await this.movieModel.updateOne(
      { tmdbId: details.id },
      {
        tmdbId: details.id,
        title: details.title,
        languages: [details.original_language],
        genres: details.genres.map((g) => g.name),
        duration: details.runtime,
        releaseDate: details.release_date
          ? new Date(details.release_date)
          : undefined,
        posterUrl: details.poster_path
          ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
          : undefined,
        backdropUrl: details.backdrop_path
          ? `https://image.tmdb.org/t/p/w780${details.backdrop_path}`
          : undefined,
        overview: details.overview,
        rating: details.vote_average,
        cast,
        crew,
        videos: selectedVideos,
        isNowShowing: flags.isNowShowing || false,
        isUpcoming: flags.isUpcoming || false,
      },
      { upsert: true }
    );

    this.logger.log(
      `Synced movie: ${details.title} (${details.original_language})`
    );
  }

  async listMovies(path: string) {
    try {
      const today = new Date();
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - 60); // 60 days in the past
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 60); // 60 days in the future

      const movies = await this.movieModel.find({
        releaseDate: { $gte: pastDate, $lte: futureDate },
      });

      return createResponse(
        200,
        true,
        "Movies retrieved successfully.",
        movies
      );
    } catch (error) {
      throw new EnhancedHttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || "Internal Server Error",
          path: path,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
