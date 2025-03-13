import { Controller, Get } from "@nestjs/common";
import { CronJobService } from "./cronJob.service";

@Controller("cron")
export class CronJobController {
  constructor(private readonly cronJobService: CronJobService) {}

  @Get("sync")
  async runSync() {
    console.log("Triggered sync by cron-job.org");
    await this.cronJobService.syncMovies();
    return { message: "Sync triggered successfully!" };
  }

  @Get("delete-movies")
  async deleteOldMovies() {
    console.log("Triggered delete-movies by cron-job.org");
    await this.cronJobService.deleteOldMovies();
    return { message: "Sync triggered successfully!" };
  }
}
