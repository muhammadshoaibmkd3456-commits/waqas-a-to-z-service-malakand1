import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Enhanced Security Headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
  }));

  // Enhanced CORS with production support
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://waqas-a-to-z-service-malakand.netlify.app',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    maxAge: 3600,
  });

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'api/v',
  });

  // Global pipes with enhanced validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      stopAtFirstError: false,
      errorHttpStatusCode: 422,
    }),
  );

  // Global filters & interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Enhanced Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('WAQAS A to Z Services API')
    .setDescription('Enterprise-grade backend for A to Z Services Portal - Premium, Secure & Scalable')
    .setVersion('2.0.0')
    .setContact('WAQAS', 'https://waqas-a-to-z-service-malakand.netlify.app', 'info@waqasatozservice.com')
    .setLicense('ISC', 'https://opensource.org/licenses/ISC')
    .addServer('http://localhost:3001', 'Development')
    .addServer('https://api.waqasatozservice.com', 'Production')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api-key')
    .addBasicAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: true,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
    },
  });

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const port = process.env.PORT || 3001;
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  await app.listen(port, '0.0.0.0');
  
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 WAQAS A to Z Services - Backend Server v2.0.0       ║
║                                                            ║
║   Environment: ${nodeEnv.toUpperCase().padEnd(45, ' ')}║
║   Server: http://0.0.0.0:${port.toString().padEnd(43, ' ')}║
║   API Docs: http://localhost:${port}/api/docs${' '.repeat(28 - port.toString().length)}║
║   Health: http://localhost:${port}/health${' '.repeat(31 - port.toString().length)}║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start application:', err);
  process.exit(1);
});
