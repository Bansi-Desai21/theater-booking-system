import { Controller, Get, Headers, ForbiddenException } from "@nestjs/common";
import { CronJobService } from "./cronJob.service";

@Controller("cron")
export class CronJobController {
  private readonly API_KEY = process.env.CRON_API_KEY;

  constructor(private readonly cronJobService: CronJobService) {}

  private validateApiKey(headers: any) {
    if (headers["authorization"] !== `Bearer ${this.API_KEY}`) {
      throw new ForbiddenException("Invalid API Key");
    }
  }

  @Get("sync")
  async runSync(@Headers() headers) {
    this.validateApiKey(headers);
    console.log("Triggered sync by GitHub Actions");
    await this.cronJobService.syncMovies();
    return { message: "Sync triggered successfully!" };
  }

  @Get("delete-movies")
  async deleteOldMovies(@Headers() headers) {
    this.validateApiKey(headers);
    console.log("Triggered delete-movies by GitHub Actions");
    await this.cronJobService.deleteOldMovies();
    return { message: "Movie deletion triggered successfully!" };
  }
}
