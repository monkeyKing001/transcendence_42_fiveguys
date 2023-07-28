import {
	createParamDecorator,
	ExecutionContext 
} from '@nestjs/common';

//why do we make Deco?
//1. want to confirm current user has signed in properly
//2. want to map Session + UserInstance
//make a decorator that will do 1, 2 just in once
//use interceptor. in fact, Decorator is also Interceptor
export const CurrentUser = createParamDecorator(
  (data: never, context: ExecutionContext) => {
	  //data is the arguments in decorator in use 
	  // ex: (@CurrentUser(arg : string) -> data === arg)
	  // never -> the deco- will not take any arguments
    const request = context.switchToHttp().getRequest();
	request.session.id;
    return request.currentUser;
  },
);
