import { Expose, Exclude } from "class-transformer";
import {Transform} from "stream";
import { User } from "src/typeorm";

export class UserDto{

	@Expose()
	intraId : string;

	@Expose()
	nickname: string

	@Expose()
	win: number;

	@Expose()
	lose: number;

	@Expose()
	friends : User[];

	@Expose()
	blocked : User[];
	
}
