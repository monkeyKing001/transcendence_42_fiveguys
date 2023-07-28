import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateUserDto {
  @MinLength(3)
  @IsNotEmpty()
  @IsString()
  intraId: string;

  @MinLength(8)
  @IsNotEmpty()
  @IsString()
  password: string;
}
