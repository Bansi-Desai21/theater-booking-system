import { HttpService } from "@nestjs/axios";
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { firstValueFrom } from "rxjs";
import { Movie, MovieDocument } from "../schemas/movies.schema";
import {
  createResponse,
  EnhancedHttpException,
} from "../utils/helper.response.function";
import * as moment from "moment";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
@Injectable()
export class MovieService {
  private readonly logger = new Logger(MovieService.name);
  private TMDB_API_URL: string;
  private TMDB_API_KEY: string;
  private readonly VALID_LANGUAGES = ["en", "hi", "gu"];
  private readonly VALID_VIDEO_LANGUAGES = ["en", "hi"];

  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Movie.name) private movieModel: Model<MovieDocument>,
    private readonly cloudinaryService: CloudinaryService
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

  public async syncNowShowing() {
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
        if (releaseDate.isBefore(sixtyDaysAgo) || releaseDate.isAfter(today))
          continue;

        const details = await this.fetchMovieDetails(movie.id);
        const detailedReleaseDate = moment(details.release_date);
        if (
          detailedReleaseDate.isBefore(sixtyDaysAgo) ||
          detailedReleaseDate.isAfter(today)
        )
          continue;

        await this.upsertMovie(details, { isNowShowing: true });
      }
      page++;
    }

    this.logger.log("Completed sync for Now Showing movies.");
  }

  public async syncUpcoming() {
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
        if (releaseDate.isBefore(today)) continue;

        const details = await this.fetchMovieDetails(movie.id);
        const detailedReleaseDate = moment(details.release_date);
        if (detailedReleaseDate.isBefore(today)) continue;

        await this.upsertMovie(details, { isUpcoming: true });
      }
      page++;
    }

    this.logger.log("Completed sync for Upcoming movies.");
  }

  private isValidLanguage(language: string) {
    return this.VALID_LANGUAGES.includes(language);
  }

  private async fetchMovieDetails(movieId: number) {
    const url = `${this.TMDB_API_URL}/movie/${movieId}?api_key=${this.TMDB_API_KEY}&append_to_response=credits,videos`;
    const response = await firstValueFrom(this.httpService.get(url));
    return response.data;
  }

  private async upsertMovie(
    details: any,
    flags: {
      isNowShowing?: boolean;
      isUpcoming?: boolean;
    }
  ) {
    const categories: string[] = [];

    if (flags.isNowShowing) categories.push("Now Showing");
    if (flags.isUpcoming) categories.push("Upcoming");

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
        categories, // Store as array
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
      },
      { upsert: true }
    );
  }

  async listMovies(path: string, query: any) {
    try {
      const { category, page = 1, limit = 10, language } = query;

      const filter: any = {};
      if (category) filter.categories = category;

      // Apply language filter (only allow en, hi, gu)
      if (language && this.VALID_LANGUAGES.includes(language)) {
        filter.languages = language;
      }

      const pageNumber = Number(page);
      const limitNumber = Number(limit);
      const skip = (pageNumber - 1) * limitNumber;

      const movies = await this.movieModel
        .find(filter)
        .skip(skip)
        .limit(limitNumber);
      const totalMovies = await this.movieModel.countDocuments(filter);

      return createResponse(200, true, "Movies retrieved successfully.", {
        totalMovies,
        movies,
      });
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

  async getMovieById(path: string, movieId: string) {
    try {
      const movie = await this.movieModel.findById(movieId);

      if (!movie) {
        throw new EnhancedHttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: "Movie not found.",
            path: path,
          },
          HttpStatus.NOT_FOUND
        );
      }

      return createResponse(200, true, "Movie retrieved successfully.", movie);
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
  private async extractCloudinaryPublicId(url: string): Promise<string | null> {
    if (!url?.startsWith("https://res.cloudinary.com")) return null;
    const pathname = new URL(url).pathname;
    return pathname.split("/").slice(4).join("/").split(".")[0] || null;
  }

  async updateMovie(movieId: string, image: any, path: string) {
    try {
      const movie = await this.movieModel.findById(movieId);
      if (!movie) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: "Movie not found.",
          path: path,
        });
      }
      let newPosterUrl: string = "";
      if (image) {
        const isCloudinaryUrl = movie.posterUrl?.startsWith(
          "https://res.cloudinary.com"
        );

        if (!movie.posterUrl || isCloudinaryUrl) {
          if (isCloudinaryUrl) {
            const publicId = await this.extractCloudinaryPublicId(
              movie.posterUrl
            );
            if (publicId) await this.cloudinaryService.deleteFile(publicId);
          }
          newPosterUrl = image;
        } else {
          const publicId = await this.extractCloudinaryPublicId(image);
          if (publicId) await this.cloudinaryService.deleteFile(publicId);

          throw new BadRequestException({
            statusCode: HttpStatus.BAD_REQUEST,
            success: false,
            message: "You can't update the original poster from TMDb.",
            path: path,
          });
        }
      }

      const updatedMovie = await this.movieModel.findByIdAndUpdate(
        movieId,
        {
          posterUrl: newPosterUrl,
        },
        { new: true }
      );

      return {
        success: true,
        message: "Movie updated successfully",
        data: updatedMovie,
      };
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

  async deleteMoviesOlderThan90Days() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const deleteResult = await this.movieModel.deleteMany({
      releaseDate: { $lt: ninetyDaysAgo },
    });

    this.logger.log(`${deleteResult.deletedCount} old movies deleted.`);

    return { message: "Old movies deleted successfully." }; // Minimized response
  }
}
