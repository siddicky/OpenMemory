import { Injectable } from '@nestjs/common';
import { 
    addHSGMemory, 
    hsgQuery, 
    reinforceMemory, 
    runDecayProcess, 
    pruneWeakWaypoints,
    SECTORS,
    SECTOR_CONFIGS
} from '../../hsg';

@Injectable()
export class HsgService {
    async addMemory(content: string, tags: string, metadata?: Record<string, unknown>) {
        return addHSGMemory(content, tags, metadata);
    }

    async query(query: string, k: number, filters?: any) {
        return hsgQuery(query, k, filters);
    }

    async reinforce(id: string, boost?: number) {
        return reinforceMemory(id, boost);
    }

    async runDecay() {
        return runDecayProcess();
    }

    async pruneWaypoints() {
        return pruneWeakWaypoints();
    }

    getSectors() {
        return { sectors: SECTORS, configs: SECTOR_CONFIGS };
    }
}
