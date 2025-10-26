import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
    public readonly port: number;
    public readonly db_path: string;
    public readonly api_key: string;
    public readonly emb_kind: string;
    public readonly embed_mode: string;
    public readonly adv_embed_parallel: boolean;
    public readonly embed_delay_ms: number;
    public readonly openai_key: string;
    public readonly gemini_key: string;
    public readonly ollama_url: string;
    public readonly local_model_path: string;
    public readonly vec_dim: number;
    public readonly min_score: number;
    public readonly decay_lambda: number;
    public readonly mode: string;
    public readonly lg_namespace: string;
    public readonly lg_max_context: number;
    public readonly lg_reflective: boolean;

    constructor() {
        this.port = Number(process.env.OM_PORT) || 8080;
        this.db_path = process.env.OM_DB_PATH || './data/openmemory.sqlite';
        this.api_key = '';
        this.emb_kind = process.env.OM_EMBEDDINGS || 'synthetic';
        this.embed_mode = process.env.OM_EMBED_MODE || 'simple';
        this.adv_embed_parallel = process.env.OM_ADV_EMBED_PARALLEL === 'true';
        this.embed_delay_ms = Number(process.env.OM_EMBED_DELAY_MS) || 200;
        this.openai_key = process.env.OPENAI_API_KEY || process.env.OM_OPENAI_API_KEY || '';
        this.gemini_key = process.env.GEMINI_API_KEY || process.env.OM_GEMINI_API_KEY || '';
        this.ollama_url = process.env.OLLAMA_URL || process.env.OM_OLLAMA_URL || 'http://localhost:11434';
        this.local_model_path = process.env.LOCAL_MODEL_PATH || process.env.OM_LOCAL_MODEL_PATH || '';
        this.vec_dim = Number(process.env.OM_VEC_DIM) || 768;
        this.min_score = Number(process.env.OM_MIN_SCORE) || 0.3;
        this.decay_lambda = Number(process.env.OM_DECAY_LAMBDA) || 0.02;
        this.mode = (process.env.OM_MODE || 'standard').toLowerCase();
        this.lg_namespace = process.env.OM_LG_NAMESPACE || 'default';
        this.lg_max_context = Number(process.env.OM_LG_MAX_CONTEXT) || 50;
        this.lg_reflective = (process.env.OM_LG_REFLECTIVE ?? 'true').toLowerCase() !== 'false';
    }
}
