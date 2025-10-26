# NestJS Migration Guide

## Overview

The OpenMemory backend has been successfully migrated from a custom HTTP server implementation to NestJS framework while maintaining 100% API compatibility.

## What Changed

### Architecture
- **Before**: Custom HTTP server using Node.js `http` module with custom routing
- **After**: NestJS framework with proper module architecture, dependency injection, and middleware

### Project Structure

```
backend/src/
├── app.module.ts              # Main application module
├── main.ts                    # NestJS bootstrap entry point
├── guards/
│   └── auth.guard.ts          # Authentication guard (replaces middleware)
├── services/
│   └── task-scheduler.service.ts  # Background task scheduler
└── modules/
    ├── config/                # Configuration management
    │   ├── config.module.ts
    │   └── config.service.ts
    ├── database/              # Database operations
    │   ├── database.module.ts
    │   └── database.service.ts
    ├── embedding/             # Embedding service wrapper
    │   ├── embedding.module.ts
    │   └── embedding.service.ts
    ├── hsg/                   # HSG memory operations
    │   ├── hsg.module.ts
    │   └── hsg.service.ts
    ├── ingestion/             # Document ingestion
    │   ├── ingestion.module.ts
    │   └── ingestion.service.ts
    ├── langgraph/             # LangGraph integration
    │   ├── langgraph.module.ts
    │   └── langgraph.service.ts
    ├── decay/                 # Memory decay operations
    │   ├── decay.module.ts
    │   └── decay.service.ts
    └── memory/                # API controllers
        ├── memory.module.ts
        └── memory.controller.ts
```

### Dependencies Added

```json
{
  "@nestjs/common": "^11.1.7",
  "@nestjs/core": "^11.1.7",
  "@nestjs/platform-express": "^11.1.7",
  "@nestjs/platform-ws": "^11.1.7",
  "@nestjs/schedule": "^6.0.1",
  "@nestjs/websockets": "^11.1.7",
  "reflect-metadata": "^0.2.2",
  "rxjs": "^7.8.2"
}
```

## Running the Application

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run start
```

### Legacy Server (for comparison)
```bash
npm run dev:old
```

## API Endpoints (No Changes)

All existing endpoints remain exactly the same:

- `GET /health` - Health check
- `GET /sectors` - Get sector information
- `POST /memory/add` - Add new memory
- `POST /memory/query` - Query memories
- `POST /memory/reinforce` - Reinforce memory
- `GET /memory/all` - Get all memories
- `GET /memory/:id` - Get specific memory
- `DELETE /memory/:id` - Delete memory
- `POST /memory/ingest` - Ingest document
- `POST /memory/ingest/url` - Ingest from URL
- `POST /langgraph/store` - Store LangGraph memory
- `POST /langgraph/retrieve` - Retrieve LangGraph memories
- `POST /langgraph/context` - Get graph context
- `POST /langgraph/reflect` - Create reflection
- `GET /langgraph/config` - Get LangGraph config

## Key Implementation Details

### Dependency Injection
All services use NestJS dependency injection with explicit `@Inject()` decorators to ensure proper resolution:

```typescript
constructor(
  @Inject(ConfigService) private readonly configService: ConfigService
) {}
```

### Background Tasks
Background tasks (decay process, waypoint pruning) are now managed by NestJS scheduler:

```typescript
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async handleDailyDecay() {
  // Decay logic
}
```

### Authentication
API key authentication is implemented as a NestJS guard applied globally:

```typescript
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
```

### CORS
CORS is configured in `main.ts`:

```typescript
app.enableCors({
  origin: '*',
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization',
});
```

## Benefits of NestJS Migration

1. **Better Organization**: Clear module structure with separation of concerns
2. **Dependency Injection**: Automatic dependency management and lifecycle hooks
3. **Type Safety**: Enhanced TypeScript support with decorators
4. **Middleware & Guards**: Built-in support for authentication and request processing
5. **Testing**: Better testing infrastructure with NestJS testing utilities
6. **Scalability**: Easier to add new features with modular architecture
7. **Documentation**: Auto-generated API documentation support (Swagger)
8. **Community**: Large ecosystem of NestJS modules and plugins

## Migration Notes

- All existing business logic in `src/hsg`, `src/embedding`, `src/ingestion`, `src/langgraph`, `src/decay` remains unchanged
- Services wrap existing functions to maintain compatibility
- Database operations preserved in `DatabaseService`
- Configuration management centralized in `ConfigService`
- Old server files kept for reference (`src/server/`)

## Testing

Tested and verified:
- ✅ Server starts successfully
- ✅ Health endpoint returns correct information
- ✅ Sector configuration endpoint works
- ✅ Memory creation and storage
- ✅ Memory querying with vector similarity
- ✅ Database initialization
- ✅ Background task scheduling
- ✅ CORS handling
- ✅ Authentication guard

## Future Enhancements

With NestJS in place, these features can be easily added:

1. **Swagger Documentation**: Add `@nestjs/swagger` for automatic API docs
2. **WebSocket Support**: Enable real-time features using NestJS WebSocket gateway
3. **GraphQL**: Add GraphQL API alongside REST
4. **Validation**: Use `class-validator` for request validation
5. **Testing**: Add comprehensive unit and e2e tests
6. **Microservices**: Split into microservices architecture if needed
7. **Health Checks**: Add more detailed health checks with `@nestjs/terminus`
8. **Rate Limiting**: Add rate limiting middleware
9. **Caching**: Integrate caching strategies
10. **Monitoring**: Add metrics and monitoring integration

## Troubleshooting

### Port Already in Use
```bash
# Kill existing process
pkill -f "tsx src/main.ts"

# Or use a different port
OM_PORT=8081 npm run dev
```

### Dependency Injection Issues
If you see "Cannot read properties of undefined", ensure services use `@Inject()` decorator:

```typescript
constructor(
  @Inject(SomeService) private readonly someService: SomeService
) {}
```

### Build Errors
Make sure TypeScript decorators are enabled in `tsconfig.json`:

```json
{
  "experimentalDecorators": true,
  "emitDecoratorMetadata": true
}
```

## Support

For issues or questions:
1. Check existing GitHub issues
2. Review NestJS documentation: https://docs.nestjs.com
3. Open a new issue with details about the problem
