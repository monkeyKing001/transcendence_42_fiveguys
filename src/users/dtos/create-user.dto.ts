import { IsNotEmpty, IsNumber, IsString, IsUrl, MinLength } from "class-validator";

export class CreateUserDto {
	@IsString()
	intraId: string;

	@IsNumber()
	intraIdNum: number;

	@IsString()
	full_name: string;

	@IsString()
	photo: URL;
}
