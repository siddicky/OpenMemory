import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from './modules/config/config.service';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables before bootstrapping
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    
    // Enable CORS
    app.enableCors({
        origin: '*',
        methods: 'GET,POST,PUT,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type,Authorization',
    });

    const configService = app.get(ConfigService);
    await app.listen(configService.port);
    console.log(`🚀 OpenMemory server running on http://localhost:${configService.port}`);
}

bootstrap();
