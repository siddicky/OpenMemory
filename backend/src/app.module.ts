import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from './modules/config/config.module';
import { DatabaseModule } from './modules/database/database.module';
import { EmbeddingModule } from './modules/embedding/embedding.module';
import { HsgModule } from './modules/hsg/hsg.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { LanggraphModule } from './modules/langgraph/langgraph.module';
import { DecayModule } from './modules/decay/decay.module';
import { MemoryModule } from './modules/memory/memory.module';
import { AuthGuard } from './guards/auth.guard';
import { TaskSchedulerService } from './services/task-scheduler.service';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        ConfigModule,
        DatabaseModule,
        EmbeddingModule,
        HsgModule,
        IngestionModule,
        LanggraphModule,
        DecayModule,
        MemoryModule,
    ],
    providers: [
        TaskSchedulerService,
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
    ],
})
export class AppModule {}
