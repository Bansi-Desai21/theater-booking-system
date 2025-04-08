import { Controller, Get, Headers, ForbiddenException } from "@nestjs/common";
import { CronJobService } from "./cronJob.service";

@Controller("cron")
export class CronJobController {
  private readonly API_KEY = process.env.CRON_API_KEY;

  constructor(private readonly cronJobService: CronJobService) {}

  private validateApiKey(headers: any) {
    console.log("Received API Key:", headers, this.API_KEY);
    if (headers["authorization"] !== `Bearer ${this.API_KEY}`) {
      throw new ForbiddenException("Invalid API Key");
    }
  }

  @Get("sync")
  async runSync(@Headers() headers) {
    this.validateApiKey(headers);
    return await this.cronJobService.syncMovies();
  }

  @Get("delete-movies")
  async deleteOldMovies(@Headers() headers) {
    this.validateApiKey(headers);
    return await this.cronJobService.deleteOldMovies();
  }

  @Get("delete-shows")
  async deleteOldShowsCron(@Headers() headers) {
    this.validateApiKey(headers);
    return await this.cronJobService.deleteOldShowsCron();
  }

  @Get("show-status")
  async showStatusCron(@Headers() headers) {
    this.validateApiKey(headers);
    return await this.cronJobService.markShowsAsCompleted();
  }

  @Get("release-seats")
  async releaseSeats(@Headers() headers) {
    this.validateApiKey(headers);
    return await this.cronJobService.updateSeatstatus();
  }
}
