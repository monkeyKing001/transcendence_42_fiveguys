import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "../auth.service";

// saves repetition of jwt authguard
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private readonly authService: AuthService) {
    super();
  }
  //canActivate is from super(jwt). suer.canActivate will follow parent's canActivate
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = (await super.canActivate(context)) as boolean;
    return result;
  }
}
