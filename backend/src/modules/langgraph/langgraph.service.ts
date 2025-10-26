import { Injectable } from '@nestjs/common';
import { 
    storeNodeMemory, 
    retrieveNodeMemories, 
    getGraphContext, 
    createReflection,
    getLangGraphConfig,
    NODE_SECTOR_MAP
} from '../../langgraph';

@Injectable()
export class LanggraphService {
    async storeNodeMemory(payload: any) {
        return storeNodeMemory(payload);
    }

    async retrieveNodeMemories(payload: any) {
        return retrieveNodeMemories(payload);
    }

    async getGraphContext(payload: any) {
        return getGraphContext(payload);
    }

    async createReflection(payload: any) {
        return createReflection(payload);
    }

    getLangGraphConfig() {
        return getLangGraphConfig();
    }

    getNodeSectorMap() {
        return NODE_SECTOR_MAP;
    }
}
