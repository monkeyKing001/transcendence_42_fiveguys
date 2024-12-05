import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';
import { UsersService } from './users/users.service';
//const cookieSession = require('cookie-session');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config: ConfigService = app.get(ConfigService);
  app.use(cookieParser());
  //  before listening, pipe first!
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, //allow extra but do not take it. only take whitelist body
    }),
  );
  app.enableCors({
    origin: true,
    methods: config.get<string>('CORS_METHODS'),
    allowedHeaders: config.get<string>('CORS_ALLOW_HEADERS'),
    //		origin : "http://localhost:3000",
    //		methods: "GET, HEAD, PUT, PATCH, POST, DELETE",
    //		allowedHeaders: 'Content-Type, Accept',
    credentials: true,
  });

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  await app.listen(config.get<number>('CORS_PORT'));
  //await app.listen(3001);
}
bootstrap();
