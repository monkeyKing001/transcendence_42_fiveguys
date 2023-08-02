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
	Request,
	Response,
	BadRequestException,
	UnauthorizedException

} from '@nestjs/common';
import {AuthService} from './auth.service';
import { CreateUserDto } from 'src/users/dtos/create-user.dto';
import {UsersService} from 'src/users/users.service';
import {Serialize} from 'src/interceptors/serialize.interceptor';
import {UserDto} from 'src/users/dtos/users.dto';
import {FortyTwoAuthGuard} from './guards/auth.fortytwoGuard';
import { FortytwoStrategy } from './strategy/fortytwo.strategy';
import {currentAuthUser} from './decorators/auth-user.decorator';
import { User } from 'src/typeorm';
import {LocalAuthGuard} from './guards/auth-local.guard';
import {AuthGuard} from '@nestjs/passport';

@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService, private usersService : UsersService){}

	//42login
	@UseGuards(FortyTwoAuthGuard)
	@Get('loginfortytwo/callback')
	async login42(@Request() req : any, @currentAuthUser() user: User, @Response({passthrough: true}) res : any){
		//we will get auth CODE for accessing public intra data.
		//let get data(intra id, profile pic) with code and
		//how to inform front? updating response!
		console.log("auth/loginfortytwo/callback")
//		console.log(req.user);
//		console.log(req.user.id);
//		console.log(req.user.login);
//		console.log(req.user.usual_full_name);
		const [intraId, intraIdNum, full_name, photo] = [res.req.user.login, res.req.user.id, res.req.user.usual_full_name, res.req.user.image];
		const user_info = {intraId, intraIdNum, full_name, photo};
		console.log(user_info);
		return (user_info);
	}

	@Post('/signup')
	@Serialize(CreateUserDto)
	async createUser(@Body() body: CreateUserDto, @Session() session : any) {
		console.log(body);
		console.log("In controller finding userid: " + body.intraId);
		const user = await this.authService.signup(body.intraId);
		session.userIntraId = user.intraId;
		return user;
	}

	@Post('/signin')
	async signin(@Body() body : CreateUserDto, @Session() session : any){
		console.log("singin in Controller");
		const user = await this.authService.signin(body.intraId);
		session.userId = user.id;
		return user;
	}
}
