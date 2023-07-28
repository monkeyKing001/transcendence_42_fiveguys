import { Injectable, NotFoundException } from "@nestjs/common";
import { UsersService } from "src/users/users.service";
import { BadRequestException } from "@nestjs/common";
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from "util";
const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService{

	constructor(private usersService: UsersService){}

	async signup(intraId: string, password: string) {
		// See if email is in use
		const users = await this.usersService.findUserByIntraId(intraId);
		if (users.length) {
			throw new BadRequestException('Intra Id is in use');
		}
		// Hash the users password
		// Generate a salt
		const salt = randomBytes(8).toString('hex');

		// Hash the salt and the password together
		// async crypto
		const hash = (await scrypt(password, salt, 32)) as Buffer;

		// Join the hashed result and the salt together
		const result = salt + '.' + hash.toString('hex');

		// Create a new user and save it
		const user = await this.usersService.create(intraId, result);

		// return the user
		return user;
	}


	async signin(intraId : string, password : string){
		//find returns list. how can pick the one?
		//비구조화 할당
		//findUserByIntraId will return array
		const [user] = await this.usersService.findUserByIntraId(intraId);
		if (!user) {
		  throw new NotFoundException('user not found');
		}
		const [salt, storedHash] = user.password.split('.');
		const hash = (await scrypt(password, salt, 32)) as Buffer;

		if (storedHash !== hash.toString('hex')) {
		  throw new BadRequestException('bad password');
		}

		return user;
	}
}
