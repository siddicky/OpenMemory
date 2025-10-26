import { Module } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { ConfigModule } from '../config/config.module';

@Module({
    imports: [ConfigModule],
    providers: [EmbeddingService],
    exports: [EmbeddingService],
})
export class EmbeddingModule {}
