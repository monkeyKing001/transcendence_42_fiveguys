import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CurrentUserInterceptor } from './interceptors/current-user.interceptor';
import {AuthController} from 'src/auth/auth.controller';
import { FortytwoStrategy } from 'src/auth/strategy/fortytwo.strategy';
import {LocalStrategy} from 'src/auth/strategy/local.startegy';
import { AuthModule } from 'src/auth/auth.module';
import {HttpModule} from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
	  TypeOrmModule.forFeature([User]),
		forwardRef(() => AuthModule),
		HttpModule,
		JwtModule.registerAsync({
			useFactory: async (configService: ConfigService) => ({
			secret: configService.get<string>('JWT_SECRET_KEY'), // Retrieve secret from environment
			signOptions: { expiresIn: '1h' }, // Optional: Set expiration time
      }),
		  inject: [ConfigService], // Inject the ConfigService
    }),

  ],
  controllers: [UsersController, AuthController],
  //providers -> include
  providers: [
		UsersService, 
		LocalStrategy,
		FortytwoStrategy,
	  ],
	exports:[UsersService],
})
export class UsersModule {}
