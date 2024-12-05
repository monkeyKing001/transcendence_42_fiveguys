import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "../auth.service";
import { TokenPayload, TokenType } from "../interfaces/token-payload.interface";
import { Request } from "express";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PartialJwtStrategy extends PassportStrategy(
  Strategy,
  "partial-jwt",
) {
  private readonly logger = new Logger(PartialJwtStrategy.name);
  constructor(private readonly authService: AuthService, private readonly configService: ConfigService) {
    super({
      secretOrKey: process.env.JWT_SECRET_KEY,
      ignoreExpiration: false,
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.jwt;
        },
      ]),
    });
  }

  async validate(payload: TokenPayload) {
    // this.logger.log(`Validating partial JWT token for user ${payload.sub}`);
    const user = await this.authService.tokenValidateUser(payload);
//    console.log(payload.intraId);
    if (!user) {
      this.logger.log("Unauthorized access caught by PartialJwtStrategy");
      throw new UnauthorizedException({
        message: "PartialJWT: no user found in database with id ",
        id: payload.id,
      });
    }
	// console.log("token type: partial")
    return user;
  }
}
