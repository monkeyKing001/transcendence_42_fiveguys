import { IsNotEmpty, IsNumber, IsString, IsUrl, MinLength } from "class-validator";

export class CreateUserDto {
	@IsString()
	intraId: string;

	@IsString()
	nickname: string;
}
