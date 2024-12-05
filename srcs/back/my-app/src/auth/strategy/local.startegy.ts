import {PassportStrategy} from "@nestjs/passport";
import { Strategy } from "passport-local";
import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import {AuthService} from "../auth.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy){
	constructor(private authService : AuthService){
		console.log("constructing startegy : ");
		super(
			{ usernameField: 'intraId', 
				passwordField: null 
			}
		);
	}

	async validate(intraId: string) : Promise<any>{
		console.log("checking user : " + intraId);
		const user = await this.authService.existUser(intraId);
//		const user = await this.authService.findUserByIntraId(intraId);
		if (!user)
			throw new UnauthorizedException;
		return (user);
	}
}
