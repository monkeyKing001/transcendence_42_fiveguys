import { 
	CanActivate, 
	ExecutionContext, 
	Injectable, 
	Logger,
	createParamDecorator,
	Inject,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core'; // Import ModuleRef
import {JwtService} from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/typeorm';

//why do we make Deco?
//1. want to confirm current user has signed in properly
//2. want to map Session + UserInstance
//make a decorator that will do 1, 2 just in once
//use interceptor. in fact, Decorator is also Interceptor
export const CurrentUserWs = createParamDecorator(
	async (data: never, context: ExecutionContext) => {
	  //data is the arguments in decorator in use 
	  // ex: (@CurrentUser(arg : string) -> data === arg)
	  // never -> the deco- will not take any arguments
		const logger: Logger = new Logger("WS Decorator");
		const client: Socket = context.switchToWs().getClient<Socket>();
//		logger.log(client.handshake.headers);
		const jwtCookie = client.handshake.headers.cookie?.split('; ').find(row => row.startsWith('jwt='))?.split('=')[1];
		if (!jwtCookie)
			return null;
		const jwtService = new JwtService();
		const payload : any = jwtService.decode(jwtCookie);
		const userId = payload.id;
		if (userId)
			logger.log("findind user id with ws decorator")
		return (userId);
  },
);
