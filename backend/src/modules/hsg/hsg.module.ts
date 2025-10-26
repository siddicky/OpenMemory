import { Module } from '@nestjs/common';
import { HsgService } from './hsg.service';

@Module({
    providers: [HsgService],
    exports: [HsgService],
})
export class HsgModule {}
