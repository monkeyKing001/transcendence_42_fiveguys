import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/typeorm';
import { UsersService } from 'src/users/users.service';
import { AuthService } from 'src/auth/auth.service';
import { AuthController } from './auth.controller';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { CurrentUserInterceptor } from 'src/users/interceptors/current-user.interceptor';
import { UsersController } from 'src/users/users.controller';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { FortytwoStrategy } from './strategy/fortytwo.strategy';
import {LocalStrategy} from './strategy/local.startegy';
import {HttpModule, HttpService} from '@nestjs/axios';

@Module({
  imports: [
	  TypeOrmModule.forFeature([User]),
	  forwardRef(() => UsersModule),
	  PassportModule, 
	  HttpModule,
  ],
  controllers: [AuthController, UsersController],
  providers: [
		AuthService,
		//globally scoped interceptor
		{
			provide: APP_INTERCEPTOR,
			useClass: CurrentUserInterceptor
		}
		,
	  ],
	exports:[AuthService],

})
export class AuthModule {}
