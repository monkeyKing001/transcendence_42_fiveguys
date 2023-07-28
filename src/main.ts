import {ValidationPipe} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
const cookieSession = require('cookie-session');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    cookieSession({
      keys: ['asdfasfd'],
    }),
  );
  //  before listening, pipe first!
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, //allow extra but do not take it. only take whitelist body
    }),
  );

  app.enableCors({
	  origin : 'http://localhost:3000',
	  methods: 'GET, HEAD, PUT, PARTCH, POST, DELETE',
	  allowedHeaders: 'Content-Type, Accept'
  })
  await app.listen(3000);
}
bootstrap();
