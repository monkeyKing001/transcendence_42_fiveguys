import { forwardRef, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { UsersController } from './users/users.controller';
import { HttpModule } from '@nestjs/axios';
import { TwoFactorModule } from './twofactor-auth/twofactor-auth.module';
import { ChatModule } from './chat/chat.module';
import { GameModule } from './game/game.module';
import {ConfigModule} from '@nestjs/config';
import { TypeOrmConfigService } from './config/typeorm.service';

@Module({
  imports: [
	ConfigModule.forRoot({
		isGlobal: true,
		cache: true,
	}),
    forwardRef(() => AuthModule),
    UsersModule,
    HttpModule,
    TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
    ChatModule,
    TwoFactorModule,
    GameModule,
  ],
  controllers: [AppController, AuthController, UsersController],
  providers: [AppService],
})
export class AppModule {}
