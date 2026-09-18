import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { parseEnv } from '@sanctra/config';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const env = parseEnv();

  app.setGlobalPrefix('v1', { exclude: ['health'] });
  app.enableCors({ credentials: true, origin: env.WEB_APP_URL });
  app.enableShutdownHooks();
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(env.PORT);
}

void bootstrap();
