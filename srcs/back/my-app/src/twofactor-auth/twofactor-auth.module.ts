import { AuthModule } from "./../auth/auth.module";
import { TwoFactorAuthService } from "./twofactor-auth.service";
import { TwoFactorAuthController } from "./twofactor-auth.controller";
import { UsersModule } from "src/users/users.module";
import { Module } from "@nestjs/common";
import { JwtStrategy } from "src/auth/strategy/jwt.strategy";
import { PartialJwtStrategy } from "src/auth/strategy/partial-jwt.strategy";
import {ConfigModule} from "@nestjs/config";

@Module({
  imports: [UsersModule, AuthModule, ConfigModule],
  controllers: [TwoFactorAuthController],
  providers: [
		TwoFactorAuthService,
		JwtStrategy,
		PartialJwtStrategy
],
})
export class TwoFactorModule {}
