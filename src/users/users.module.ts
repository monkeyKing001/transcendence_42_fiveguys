import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthService } from 'src/auth/auth.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CurrentUserInterceptor } from './interceptors/current-user.interceptor';
import {AuthController} from 'src/auth/auth.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController, AuthController],
  providers: [
		UsersService, 
		AuthService,
		//globally scoped interceptor
		{
			provide: APP_INTERCEPTOR,
			useClass: CurrentUserInterceptor,
		},
	  ],
	exports:[UsersService],
})
export class UsersModule {}
