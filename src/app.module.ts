import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { UsersController } from './users/users.controller';
import { ChannelModule } from './channel/channel.module';

@Module({
  imports: [
		AuthModule,
		UsersModule,
		TypeOrmModule.forRoot({
		  "type": "postgres",
		  "host": "localhost",
		  "port": 5432,
		  "username": "gwagdong-u",
		  "password": "",
		  "database": "tr42",
		  "synchronize": true,
		  "logging": true,
		  "entities": ["dist/**/*.entity.{ts,js}"]
		}),
		ChannelModule,
//	  TypeOrmModule.forRoot({
//      type: 'postgres',//orm type notification
//      database: 'tr42',//db.sqlite is file base database
//      entities: entities,//entities will be users, reports
//      synchronize: true,
//	  }),
//		TypeOrmModule.forRootAsync({
//			  imports: [ConfigModule],
//			  useFactory: (configService: ConfigService) => ({
//				type: 'postgres',
////				host: configService.get('DB_HOST'),
////				port: +configService.get<number>('DB_PORT'),
////				username: configService.get('DB_USERNAME'),
////				password: configService.get('DB_PASSWORD'),
////				database: configService.get('DB_NAME'),
////				entities: entities,
//				entities: entities,
//				database:'db.postgres',
//				synchronize: true,
//			  }),
//			   inject: [ConfigService],
//    }),
//		ConfigModule.forRoot({ isGlobal: true }),
 ],
  controllers: [AppController, AuthController, UsersController],
  providers: [AppService],
})
export class AppModule {}
