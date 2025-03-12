import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { MovieService } from "../movies/movies.service";

@Injectable()
export class CronJobService {
  private readonly logger = new Logger(CronJobService.name);

  constructor(private readonly movieService: MovieService) {}

  // Runs daily at 12:00 AM
  @Cron("0 0 * * *")
  async syncMovies() {
    this.logger.log("Starting movie sync...");
    await Promise.all([
      await this.movieService.syncNowShowing(),
      await this.movieService.syncUpcoming(),
    ]);
    this.logger.log("Movie sync completed.");
  }

  // Runs daily at 12:10 AM to delete older movies
  @Cron("10 0 * * *")
  async deleteOldMovies() {
    this.logger.log("Deleting movies older than 90 days...");
    await this.movieService.deleteMoviesOlderThan90Days();
    this.logger.log("Old movie deletion completed.");
  }
}
