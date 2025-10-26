import { Module } from '@nestjs/common';
import { MemoryController } from './memory.controller';
import { HsgModule } from '../hsg/hsg.module';
import { EmbeddingModule } from '../embedding/embedding.module';
import { IngestionModule } from '../ingestion/ingestion.module';
import { LanggraphModule } from '../langgraph/langgraph.module';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule } from '../config/config.module';

@Module({
    imports: [ConfigModule, DatabaseModule, HsgModule, EmbeddingModule, IngestionModule, LanggraphModule],
    controllers: [MemoryController],
})
export class MemoryModule {}
