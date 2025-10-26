import { 
    Controller, 
    Get, 
    Post, 
    Delete, 
    Body, 
    Param, 
    Query,
    HttpException,
    HttpStatus,
    UseGuards
} from '@nestjs/common';
import { HsgService } from '../hsg/hsg.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { IngestionService } from '../ingestion/ingestion.service';
import { LanggraphService } from '../langgraph/langgraph.service';
import { DatabaseService } from '../database/database.service';
import { ConfigService } from '../config/config.service';
import type {
    add_req,
    q_req,
    ingest_req,
    ingest_url_req,
    lgm_store_req,
    lgm_retrieve_req,
    lgm_context_req,
    lgm_reflection_req
} from '../../types';

@Controller()
export class MemoryController {
    constructor(
        private readonly hsgService: HsgService,
        private readonly embeddingService: EmbeddingService,
        private readonly ingestionService: IngestionService,
        private readonly langgraphService: LanggraphService,
        private readonly databaseService: DatabaseService,
        private readonly configService: ConfigService,
    ) {}

    @Get('health')
    async health() {
        return {
            ok: true,
            version: '2.0-hsg',
            embedding: this.embeddingService.getEmbeddingInfo()
        };
    }

    @Get('sectors')
    async sectors() {
        try {
            const stats = await this.databaseService.allAsync(`
                select primary_sector as sector, count(*) as count, avg(salience) as avg_salience 
                from memories 
                group by primary_sector
            `);
            const { sectors, configs } = this.hsgService.getSectors();
            return {
                sectors,
                configs,
                stats
            };
        } catch (error) {
            throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('memory/add')
    async addMemory(@Body() body: add_req) {
        if (!body?.content) {
            throw new HttpException({ err: 'content' }, HttpStatus.BAD_REQUEST);
        }
        try {
            const result = await this.hsgService.addMemory(
                body.content,
                JSON.stringify(body.tags || []),
                body.metadata
            );
            return result;
        } catch (error) {
            console.error('Error adding HSG memory:', error);
            throw new HttpException({ err: 'internal' }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('memory/ingest')
    async ingestDocument(@Body() body: ingest_req) {
        if (!body?.content_type || !body?.data) {
            throw new HttpException({ err: 'missing_params' }, HttpStatus.BAD_REQUEST);
        }
        try {
            const result = await this.ingestionService.ingestDocument(
                body.content_type,
                body.data,
                body.metadata,
                body.config
            );
            return result;
        } catch (error) {
            console.error('Error ingesting document:', error);
            throw new HttpException({
                err: 'ingestion_failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('memory/ingest/url')
    async ingestURL(@Body() body: ingest_url_req) {
        if (!body?.url) {
            throw new HttpException({ err: 'missing_url' }, HttpStatus.BAD_REQUEST);
        }
        try {
            const result = await this.ingestionService.ingestURL(body.url, body.metadata, body.config);
            return result;
        } catch (error) {
            console.error('Error ingesting URL:', error);
            throw new HttpException({
                err: 'url_ingestion_failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('memory/query')
    async queryMemory(@Body() body: q_req) {
        const k = body.k || 8;
        try {
            const filters = {
                sectors: body.filters?.sector ? [body.filters.sector] : undefined,
                minSalience: body.filters?.min_score
            };
            const matches = await this.hsgService.query(body.query, k, filters);
            return {
                query: body.query,
                matches: matches.map(m => ({
                    id: m.id,
                    content: m.content,
                    score: m.score,
                    sectors: m.sectors,
                    primary_sector: m.primary_sector,
                    path: m.path,
                    salience: m.salience,
                    last_seen_at: m.last_seen_at
                }))
            };
        } catch (error) {
            console.error('Error in HSG query:', error);
            return { query: body.query, matches: [] };
        }
    }

    @Post('memory/reinforce')
    async reinforceMemory(@Body() body: { id: string, boost?: number }) {
        if (!body?.id) {
            throw new HttpException({ err: 'id' }, HttpStatus.BAD_REQUEST);
        }
        try {
            await this.hsgService.reinforce(body.id, body.boost);
            return { ok: true };
        } catch (error) {
            throw new HttpException({ err: 'nf' }, HttpStatus.NOT_FOUND);
        }
    }

    @Get('memory/all')
    async getAllMemories(
        @Query('u') offsetParam?: string,
        @Query('l') limitParam?: string,
        @Query('sector') sector?: string
    ) {
        try {
            const offset = offsetParam ? parseInt(offsetParam) : 0;
            const limit = limitParam ? parseInt(limitParam) : 100;
            
            const rawRows = sector
                ? await this.databaseService.getAllMemoriesBySector(sector, limit, offset)
                : await this.databaseService.getAllMemories(limit, offset);
            
            const rows = rawRows.map((r: any) => ({
                id: r.id,
                content: r.content,
                tags: JSON.parse(r.tags),
                metadata: JSON.parse(r.meta),
                created_at: r.created_at,
                updated_at: r.updated_at,
                last_seen_at: r.last_seen_at,
                salience: r.salience,
                decay_lambda: r.decay_lambda,
                primary_sector: r.primary_sector,
                version: r.version
            }));
            return { items: rows };
        } catch (error) {
            throw new HttpException({ err: 'internal' }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('memory/:id')
    async getMemory(@Param('id') id: string) {
        try {
            const memory = await this.databaseService.getMemory(id);
            if (!memory) {
                throw new HttpException({ err: 'nf' }, HttpStatus.NOT_FOUND);
            }

            const vectors = await this.databaseService.getVectorsById(id);
            const sectors = vectors.map(v => v.sector);

            return {
                id: memory.id,
                content: memory.content,
                primary_sector: memory.primary_sector,
                sectors,
                tags: JSON.parse(memory.tags),
                metadata: JSON.parse(memory.meta),
                created_at: memory.created_at,
                updated_at: memory.updated_at,
                last_seen_at: memory.last_seen_at,
                salience: memory.salience,
                decay_lambda: memory.decay_lambda,
                version: memory.version
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({ err: 'internal' }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Delete('memory/:id')
    async deleteMemory(@Param('id') id: string) {
        try {
            const r = await this.databaseService.getMemory(id);
            if (!r) {
                throw new HttpException({ err: 'nf' }, HttpStatus.NOT_FOUND);
            }
            await this.databaseService.deleteMemory(id);
            await this.databaseService.deleteVectors(id);
            await this.databaseService.deleteWaypoints(id, id);
            return { ok: true };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException({ err: 'internal' }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // LangGraph endpoints
    @Post('langgraph/store')
    async langgraphStore(@Body() body: lgm_store_req) {
        try {
            const result = await this.langgraphService.storeNodeMemory(body);
            return result;
        } catch (error) {
            console.error('LangGraph store error:', error);
            throw new HttpException({
                err: 'store_failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('langgraph/retrieve')
    async langgraphRetrieve(@Body() body: lgm_retrieve_req) {
        try {
            const result = await this.langgraphService.retrieveNodeMemories(body);
            return result;
        } catch (error) {
            console.error('LangGraph retrieve error:', error);
            throw new HttpException({
                err: 'retrieve_failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('langgraph/context')
    async langgraphContext(@Body() body: lgm_context_req) {
        try {
            const result = await this.langgraphService.getGraphContext(body);
            return result;
        } catch (error) {
            console.error('LangGraph context error:', error);
            throw new HttpException({
                err: 'context_failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('langgraph/reflect')
    async langgraphReflect(@Body() body: lgm_reflection_req) {
        try {
            const result = await this.langgraphService.createReflection(body);
            return result;
        } catch (error) {
            console.error('LangGraph reflection error:', error);
            throw new HttpException({
                err: 'reflection_failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('langgraph/config')
    async langgraphConfig() {
        return this.langgraphService.getLangGraphConfig();
    }
}
