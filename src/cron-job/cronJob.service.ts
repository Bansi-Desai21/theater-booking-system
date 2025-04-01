import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { MovieService } from "../movies/movies.service";
import { ShowService } from "../show/show.service";

@Injectable()
export class CronJobService {
  private readonly logger = new Logger(CronJobService.name);

  constructor(
    private readonly movieService: MovieService,
    private readonly showService: ShowService
  ) {}

  // Runs daily at 12:00 AM
  @Cron("0 0 * * *")
  async syncMovies() {
    this.logger.log("Starting movie sync...");
    await Promise.all([
      this.movieService.syncNowShowing(),
      this.movieService.syncUpcoming(),
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

  //Shows cron jobs
  @Cron("30 0 * * *")
  async deleteOldShowsCron() {
    this.logger.log("Running scheduled job: Deleting old shows...");
    await this.showService.deleteOldShows();
    this.logger.log(`Old shows deleted.`);
  }

  @Cron("*/10 * * * *")
  async markShowsAsCompleted() {
    this.logger.log("Running scheduled job: update show status...");
    await this.showService.markShowsAsCompleted();
    this.logger.log(`Show status updated.`);
  }
}
