import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '../modules/config/config.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        @Inject(ConfigService) private readonly configService: ConfigService
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        
        // If no API key is configured, allow all requests
        if (!this.configService.api_key) {
            return true;
        }

        const authHeader = request.headers['authorization'] || '';
        if (!authHeader.startsWith('Bearer ') || authHeader.slice(7) !== this.configService.api_key) {
            throw new UnauthorizedException({ err: 'auth' });
        }

        return true;
    }
}
