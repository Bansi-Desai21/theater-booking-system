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
    return await Promise.all([
      this.movieService.syncNowShowing(),
      this.movieService.syncUpcoming(),
    ]);
  }

  async deleteOldMovies() {
    this.logger.log("Deleting movies older than 90 days...");
    return await this.movieService.deleteMoviesOlderThan90Days();
  }

  async deleteOldShowsCron() {
    this.logger.log("Running scheduled job: Deleting old shows...");
    return await this.showService.deleteOldShows();
  }

  async markShowsAsCompleted() {
    this.logger.log("Running scheduled job: update show status...");
    return await this.showService.markShowsAsCompleted();
  }

  async updateSeatstatus() {
    this.logger.log("Running scheduled job: Releasing seat...");
    return await this.seatLayoutService.releaseExpiredSeats();
  }
}
