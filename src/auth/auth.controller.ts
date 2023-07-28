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
import {AuthService} from './auth.service';
import { CreateUserDto } from 'src/users/dtos/create-user.dto';
import {UsersService} from 'src/users/users.service';
import {Serialize} from 'src/interceptors/serialize.interceptor';
import {UserDto} from 'src/users/dtos/users.dto';

@Controller('auth')
@Serialize(UserDto)
export class AuthController {
	constructor(private authService: AuthService, private usersService : UsersService){}

	@Post('/signup')
	async createUser(@Body() body: CreateUserDto, @Session() session : any) {
		const user = await this.authService.signup(body.intraId, body.password);
		session.userIntraId = user.intraId;
		return user;
	}

	@Post('/signin')
	async signin(@Body() body : CreateUserDto, @Session() session : any){
		console.log("singin in Controller");
		const user = await this.authService.signin(body.intraId, body.password);
		session.userId = user.id;
		return user;
	}
}
