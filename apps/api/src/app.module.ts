import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { parseEnv } from '@sanctra/config';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: (config) => parseEnv(config) }),
    AuthModule,
    HealthModule,
  ],
})
export class AppModule {}
