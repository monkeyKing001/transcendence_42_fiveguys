import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { User } from 'src/typeorm';
import { UserStatus } from 'src/typeorm/user.entity';
import { GamePlayer } from 'src/typeorm';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  nickname: string;

  @IsOptional()
  friends: User[];

  @IsOptional()
  blocks: User[];

  @IsOptional()
  @IsNumber()
  wins: number;

  @IsOptional()
  @IsNumber()
  loses: number;

  @IsOptional()
  @IsBoolean()
  currentAvatarData: boolean;

  @IsOptional()
  @IsBoolean()
  twoFA: boolean;

  @IsString()
  @IsOptional()
  twoFASecret: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status: UserStatus;

  @IsString()
  @IsOptional()
  socketId: string;

  @IsOptional()
  gamePlayer: GamePlayer;

  @IsOptional()
  profilePicture: Buffer;
}
