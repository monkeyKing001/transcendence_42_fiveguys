import { IsString, IsNotEmpty, IsDefined } from "class-validator";

export class TwoFactorAuthCodeDto {
  @IsString()
  @IsNotEmpty()
  @IsDefined()
  twoFactorAuthCode!: string;
  //The ! asserts to TypeScript that the twoFactorAuthCode property will be assigned a value at runtime, even though TypeScript's static analysis might not be able to guarantee it.
}
