import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/typeorm';
import { UsersService } from 'src/users/users.service';
import { AuthService } from 'src/auth/auth.service';
import { AuthController } from './auth.controller';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CurrentUserInterceptor } from 'src/users/interceptors/current-user.interceptor';
import { UsersController } from 'src/users/users.controller';
import {UsersModule} from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), UsersModule],
  controllers: [AuthController, UsersController],
  providers: [
		AuthService,
		UsersService, 
		//globally scoped interceptor
		{
			provide: APP_INTERCEPTOR,
			useClass: CurrentUserInterceptor,
		},
	  ],
	exports:[AuthService],

})
export class AuthModule {}
