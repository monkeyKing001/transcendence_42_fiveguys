import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/auth-jwt.guard';
import { GameService } from './game.service';
import { Result } from './interfaces/game.interface';
import { currentAuthUser } from 'src/auth/decorators/auth-user.decorator';
import { User } from 'src/typeorm';
import {UsersService} from 'src/users/users.service';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService, private readonly usersService : UsersService) {}

	@Get('gameStats/my')
	@UseGuards(JwtAuthGuard)
	public async getMyGames(
		@currentAuthUser() user : User
	){
		const games: Result[] = await this.gameService.getGameStatForPlayer(user.id)
		return ({games: games});
  }

	@Get('gameStats/id/:userId')
	@UseGuards(JwtAuthGuard)
	public async getOneById(
		@Param('userId') userId: string
	) {

		const games: Result[] = await this.gameService.getGameStatForPlayer(parseInt(userId))
		return ({games: games});
    }

	@Get('gameStats/leaderBoard')
	public async getLeaderBoard(){
		const RankerUsers : User[] = await this.usersService.getTopRankers();
		return RankerUsers;
	}
}
