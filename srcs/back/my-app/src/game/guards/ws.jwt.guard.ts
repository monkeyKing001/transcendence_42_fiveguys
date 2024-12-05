import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/typeorm';
import {UsersService} from 'src/users/users.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
    private logger: Logger = new Logger(WsJwtGuard.name);

    constructor(private authService: AuthService, private usersService: UsersService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const client: Socket = context.switchToWs().getClient<Socket>();
			const jwtCookie = client.handshake.headers.cookie?.split('; ').find(row => row.startsWith('jwt='))?.split('=')[1];
			//this.logger.log(client.handshake.headers);
			if (jwtCookie)
			{
				const user: User = await this.authService.verifyUser(jwtCookie);
				if (user)
				{
					context.switchToHttp().getRequest().user = user
					this.logger.log("binding socket id with user id in guard");
				return Boolean(user);
				}
			}
        } catch (err) {
            throw new WsException(err.message);
        }
    }
}
