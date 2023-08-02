import { Body, 
	Controller, 
	Post, 
	Get, 
	Patch, 
	Param, 
	Query, 
	Delete, 
	UseInterceptors,
	Session,
	UseGuards,

} from '@nestjs/common';
import { User } from '../typeorm/user.entity';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UserDto } from './dtos/users.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { NotFoundException } from '@nestjs/common';
import {AuthService} from 'src/auth/auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthGuard } from './guards/auth.guard';

@Controller('users')
export class UsersController {
	constructor(private usersService: UsersService ){}

	@Get('/whoami')
	@UseGuards(AuthGuard)
	whoAmI(@CurrentUser() user: User) {
		return user;
	}

	@Post('/test')
	test(){
		console.log("test post users/test/")
	}

	@Get('/:id')
	async findUser(@Param('id') id: string){
//		console.log("GET PARAM called");
		console.log("Handler is running");
		const user : User = await this.usersService.findUserById(parseInt(id));
		if (!user) {
		  throw new NotFoundException('user not found');
		}
		return user;
	}

	@Get('/:intraId')
	async findUserByIntraId(@Param('intraId') intraId: string){
//		console.log("GET PARAM called");
		console.log("Handler is running");
		const user = await this.usersService.findUserByIntraId(intraId);
		if (!user) {
		  throw new NotFoundException('user not found');
		}
		return user;
	}

	@Delete('/:id')
	removeUser(@Param('id') id: string) {
		return this.usersService.remove(parseInt(id));
	}


	@Patch('/:id')
	updateUser(@Param('id') id: string, @Body() body: UpdateUserDto){
		return this.usersService.update(parseInt(id), body);
	}
}
