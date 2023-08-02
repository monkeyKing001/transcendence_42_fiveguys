import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthService } from 'src/auth/auth.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CurrentUserInterceptor } from './interceptors/current-user.interceptor';
import {AuthController} from 'src/auth/auth.controller';
import { FortytwoStrategy } from 'src/auth/strategy/fortytwo.strategy';
import {LocalStrategy} from 'src/auth/strategy/local.startegy';
import { AuthModule } from 'src/auth/auth.module';
import {HttpModule} from '@nestjs/axios';

@Module({
  imports: [
	  TypeOrmModule.forFeature([User]),
		forwardRef(() => AuthModule),
		HttpModule
  ],
  controllers: [UsersController, AuthController],
  //providers -> include
  providers: [
		UsersService, 
		//globally scoped interceptor
		{
			provide: APP_INTERCEPTOR,
			useClass: CurrentUserInterceptor,
		},
		LocalStrategy,
		FortytwoStrategy,
	  ],
	exports:[UsersService],
})
export class UsersModule {}
