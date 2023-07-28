import { CanActivate, ExecutionContext } from '@nestjs/common';

//why do use AuthGuard?
//1. want to confirm current user has signed in properly
//2. want to map Session + UserInstance
//make a decorator that will do 1, 2 just in once
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
	//catch request
    const request = context.switchToHttp().getRequest();
	//make current requst session id to userId;
    return request.session.userId;
  }
}
