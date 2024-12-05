import { Module, forwardRef } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import {UsersModule} from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import {Games} from 'src/typeorm/game.entity';
import { GamePlayer } from 'src/typeorm/gamePlayer.entity';
import { User } from 'src/typeorm';
import {JwtModule} from '@nestjs/jwt';
import { ChatModule } from 'src/chat/chat.module';
import { ConfigService } from '@nestjs/config';

@Module({
	imports: [
		JwtModule.registerAsync({
			useFactory: async (configService: ConfigService) => ({
			secret: configService.get<string>('JWT_SECRET_KEY'), // Retrieve secret from environment
			signOptions: { expiresIn: '1h' }, // Optional: Set expiration time
      }),
		  inject: [ConfigService], // Inject the ConfigService
		}),
		forwardRef(() => AuthModule),
		forwardRef(() => UsersModule),
	  	TypeOrmModule.forFeature([Games, GamePlayer, User]),
		ChatModule,
	],

	controllers: [GameController],
	providers: [GameService, GameGateway]
})
export class GameModule {}
