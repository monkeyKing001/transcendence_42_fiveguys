import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Injectable,
} from '@nestjs/common';
import { Socket } from 'socket.io';
import { GameService } from '../game.service';

@Injectable()
export class CurrentUserGameRoom implements NestInterceptor {
  constructor(private gameService: GameService) {}

  async intercept(context: ExecutionContext, handler: CallHandler) {
	const client: Socket = context.switchToWs().getClient<Socket>();
	const rooms = Array.from(client.rooms);
	//if request.session exist,
	//get userId in session.

    if (rooms.length > 1) {
		console.log("more than 1 room\n");
		console.log(rooms);
    }
    return handler.handle();
  }
}
