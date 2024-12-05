import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "src/users/users.service";
import { Request } from "express";
import {AuthService} from "../auth.service";
import { TokenPayload, TokenType } from "../interfaces/token-payload.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  constructor(private readonly authService : AuthService) {
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

  //return user after UseGuards(JwtAuthGuard)
  async validate(payload: TokenPayload) {
    // const user = await this.userService.findUserById(payload.sub);
    const user = await this.authService.tokenValidateUser(payload);
//	this.logger.log(`Validating JWT token for user ${payload.intraId}`);
    if (!user) {
      this.logger.log("Unauthorized access caught by JwtStrategy");
      throw new UnauthorizedException({
        message: "JWT: no user found in database with id ",
        id: payload.id,
      });
    }
    // only validates if JWT token payload indicates full access
	// return user to request
    if (payload.type === TokenType.FULL) {
		// console.log("token type: full")
      return user;
    }
  }
}
