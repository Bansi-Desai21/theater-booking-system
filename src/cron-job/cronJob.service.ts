import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { MovieService } from "../movies/movies.service";
import { ShowService } from "../show/show.service";
import { SeatLayoutService } from "../seat-layout/seat-layout.service";
@Injectable()
export class CronJobService {
  private readonly logger = new Logger(CronJobService.name);

  constructor(
    private readonly movieService: MovieService,
    private readonly showService: ShowService,
    private readonly seatLayoutService: SeatLayoutService
  ) {}

  async syncMovies() {
    this.logger.log("Starting movie sync...");
    await Promise.all([
      this.movieService.syncNowShowing(),
      this.movieService.syncUpcoming(),
    ]);
    this.logger.log("Movie sync completed.");
  }

  async deleteOldMovies() {
    this.logger.log("Deleting movies older than 90 days...");
    await this.movieService.deleteMoviesOlderThan90Days();
    this.logger.log("Old movie deletion completed.");
  }

  async deleteOldShowsCron() {
    this.logger.log("Running scheduled job: Deleting old shows...");
    await this.showService.deleteOldShows();
    this.logger.log(`Old shows deleted.`);
  }

  async markShowsAsCompleted() {
    this.logger.log("Running scheduled job: update show status...");
    await this.showService.markShowsAsCompleted();
    this.logger.log(`Show status updated.`);
  }

  async updateSeatstatus() {
    this.logger.log("Running scheduled job: Releasing seat...");
    await this.seatLayoutService.releaseExpiredSeats();
    this.logger.log(`Seat status updated.`);
  }
}
