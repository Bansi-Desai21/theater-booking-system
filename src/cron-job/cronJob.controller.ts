import { Controller, Get } from "@nestjs/common";
import { CronJobService } from "./cronJob.service";

@Controller("cron")
export class CronJobController {
  constructor(private readonly cronJobService: CronJobService) {}

  @Get("sync")
  async runSync() {
    await this.cronJobService.syncMovies();
    return { message: "Sync triggered successfully!" };
  }

  @Get("deleteMovies")
  async deleteOldMovies() {
    await this.cronJobService.deleteOldMovies();
    return { message: "Sync triggered successfully!" };
  }
}
