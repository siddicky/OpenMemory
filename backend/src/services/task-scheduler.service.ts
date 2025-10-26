import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HsgService } from '../modules/hsg/hsg.service';

@Injectable()
export class TaskSchedulerService implements OnModuleInit {
    private readonly logger = new Logger(TaskSchedulerService.name);

    constructor(
        @Inject(HsgService) private readonly hsgService: HsgService
    ) {}

    async onModuleInit() {
        // Run initial decay process
        this.logger.log('Running initial decay process...');
        try {
            const result = await this.hsgService.runDecay();
            this.logger.log(`🚀 Initial decay: ${result.decayed}/${result.processed} memories updated`);
        } catch (error) {
            this.logger.error('Initial decay process failed:', error);
        }
    }

    // Run decay process daily
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleDailyDecay() {
        this.logger.log('🧠 Running HSG decay process...');
        try {
            const result = await this.hsgService.runDecay();
            this.logger.log(`✅ Decay completed: ${result.decayed}/${result.processed} memories updated`);
        } catch (error) {
            this.logger.error('❌ Decay process failed:', error);
        }
    }

    // Prune weak waypoints weekly
    @Cron(CronExpression.EVERY_WEEK)
    async handleWeeklyPrune() {
        this.logger.log('🔗 Pruning weak waypoints...');
        try {
            const pruned = await this.hsgService.pruneWaypoints();
            this.logger.log(`✅ Pruned ${pruned} weak waypoints`);
        } catch (error) {
            this.logger.error('❌ Waypoint pruning failed:', error);
        }
    }
}
