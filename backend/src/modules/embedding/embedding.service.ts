import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { embedForSector, embedMultiSector, getEmbeddingInfo, EmbeddingResult } from '../../embedding';

@Injectable()
export class EmbeddingService {
    constructor(private configService: ConfigService) {}

    async embedForSector(text: string, sector: string): Promise<number[]> {
        return embedForSector(text, sector);
    }

    async embedMultiSector(id: string, text: string, sectors: string[], chunks?: Array<{ text: string }>): Promise<EmbeddingResult[]> {
        return embedMultiSector(id, text, sectors, chunks);
    }

    getEmbeddingInfo() {
        return getEmbeddingInfo();
    }
}
