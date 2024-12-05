import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Injectable,
} from '@nestjs/common';
import { UsersService } from '../users.service';

@Injectable()
export class CurrentUserInterceptor implements NestInterceptor {
  constructor(private usersService: UsersService) {}

  async intercept(context: ExecutionContext, handler: CallHandler) {
    const request = context.switchToHttp().getRequest();
	//if request.session exist,
	//get userId in session.
	const { userId } = request.session || {};
//	console.log("Interceptor executed!\n");

    if (userId) {
      const user = await this.usersService.findUserById(userId);
	  //assign user to request and then pass the context to decorator
      request.currentUser = user;
    }
    return handler.handle();
  }
}
