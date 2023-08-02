import { Injectable, NotFoundException } from "@nestjs/common";
import { UsersService } from "src/users/users.service";
import { BadRequestException } from "@nestjs/common";
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from "util";
import { FortytwoStrategy } from "./strategy/fortytwo.strategy";
import { LocalStrategy } from "./strategy/local.startegy";

@Injectable()
export class AuthService{

	constructor(private usersService: UsersService){}

//	async kakaoLoginAuth(code: string, domain : string){
//		const kakao_user = await this.kakaostrategy.kakaoLogin({code, domain});
//		return kakao_user;
//	}

	async signup(intraId: string) {
		// See if email is in use
		const users = await this.usersService.findUserByIntraId(intraId);
		if (users) {
			throw new BadRequestException('Intra Id is in use');
		}
		// Hash the users password
		// Generate a salt

		// Create a new user and save it. user servive makes entity and saves it
		const user = await this.usersService.create(intraId);

		// return the user
		return user;
	}


	async signin(intraId : string){
		//find returns list. how can pick the one?
		//비구조화 할당
		//findUserByIntraId will return array
		const user = await this.usersService.findUserByIntraId(intraId);
		if (!user) {
		  throw new NotFoundException('user not found');
		}
		return user;
	}
	
	async existUser(intraId : string) : Promise<any | null>{
		const user = await this.usersService.findUserByIntraId(intraId);
			console.log("checking user : " + user);
		if (user)
		{
			console.log("checking existing : " + user.intraId);
			const { intraId, ...rest} = user;
			return (user);
		}
		else
			return null;
	}
}
