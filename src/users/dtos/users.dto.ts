import { Expose, Exclude } from "class-transformer";

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
	rate: number;

	@Expose()
	rank: number;
}
