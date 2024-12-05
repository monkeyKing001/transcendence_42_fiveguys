import { UsersService } from "src/users/users.service";
import { User } from "src/typeorm";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { authenticator } from "otplib";
import { toDataURL, toFileStream } from "qrcode";
import { Response } from "express";
import * as CryptoJS from 'crypto-js';
import {ConfigService} from "@nestjs/config";

@Injectable()
export class TwoFactorAuthService {
  private readonly logger = new Logger(TwoFactorAuthService.name);
  constructor(private readonly userService: UsersService, private readonly configServie: ConfigService) {}

  async generateTwoFactorAuthSecret(user: User) {
    this.logger.log(`Generating 2FA secret for user ${user.id}`);
	//generate secret key
	try {
		const secret = authenticator.generateSecret();

		//hash encode
		//ENCRYPTION
		const ENCRYPTION_SECRET = this.configServie.get('TFA_SECRET');
		const encrypted = CryptoJS.AES.encrypt(secret, ENCRYPTION_SECRET).toString();

		//get APP name
		const appName = "tr42";

		//generate otpauthUrl
		const otpauthUrl = authenticator.keyuri(user.intraId, appName, secret);

		await this.userService.update(user.id, {twoFASecret: encrypted});
		return otpauthUrl;
		
	} catch (e) {
		this.logger.log("Failed to create secret key. please try again.");
		return (null);
		/* handle error */
	}
  }

  async pipeQrCodeStream(stream: Response, otpauthUrl: string) {
    return toFileStream(stream, otpauthUrl);
  }

  async getQrCodeAsDataUrl(otpauthUrl: string) {
    return await toDataURL(otpauthUrl);
  }

  async isTwoFactorAuthCodeValid(twoFactorAuthCode: string, user: User) {
    if (!user.twoFASecret || user.twoFASecret.length < 1) {
      throw new BadRequestException("2FA: user has not registered a secret");
    }
	
	//hash decoding
	const ENCRYPTION_SECRET = this.configServie.get('TFA_SECRET');
	const decoded_secret = CryptoJS.AES.decrypt(user.twoFASecret, ENCRYPTION_SECRET).toString(CryptoJS.enc.Utf8);
	
    return authenticator.verify({
      token: twoFactorAuthCode,
      secret: decoded_secret,
    });
  }

  async enableTwoFactor(user: User) {
    await this.userService.update(user.id, { twoFA: true });
  }

  async disableTwoFactor(user: User) {
    await this.userService.update(user.id, {
      twoFA: false,
      twoFASecret: null
    });
  }
}
