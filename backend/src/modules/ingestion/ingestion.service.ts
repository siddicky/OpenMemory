import { Injectable } from '@nestjs/common';
import { ingestDocument, ingestURL } from '../../ingestion';

@Injectable()
export class IngestionService {
    async ingestDocument(
        contentType: string,
        data: string,
        metadata?: Record<string, unknown>,
        config?: any
    ) {
        return ingestDocument(contentType, data, metadata, config);
    }

    async ingestURL(url: string, metadata?: Record<string, unknown>, config?: any) {
        return ingestURL(url, metadata, config);
    }
}
