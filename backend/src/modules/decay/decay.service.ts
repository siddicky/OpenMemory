import { Injectable } from '@nestjs/common';
import { apply_decay } from '../../decay';

@Injectable()
export class DecayService {
    async applyDecay() {
        return apply_decay();
    }
}
