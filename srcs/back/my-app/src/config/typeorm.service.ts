import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';

//  Typeorm config
@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  @Inject(ConfigService)
  private readonly config: ConfigService;

  public createTypeOrmOptions(): TypeOrmModuleOptions {
    return {

      //  Database connection
      type: 'postgres',
      host: this.config.get<string>('DATABASE_HOST'),
      port: this.config.get<number>('DATABASE_PORT'),
      database: this.config.get<string>('DATABASE_NAME'),
      username: this.config.get<string>('DATABASE_USER'),
      password: this.config.get<string>('DATABASE_PASSWORD'),
      //  Database tables to check for migrations
      entities: ['dist/**/*.entity.{ts,js}'],

      logger: 'file',
      synchronize: true, 
      autoLoadEntities: true,

      //  We will turn synchronize on and not use migrations for this project.
    
      //  Migrations allows to keep our data when we make changes to the database instead of having to delete it.
      //  Synchronize is easier to use but can't deal with most changes in data tables, meaning we will have to delete it sometimes.
      //  This variable should NEVER be set to true in production !
    };
  }
}
