import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../typeorm/user.entity';
import { NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';

@Injectable()
export class UsersService {
	constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

	createUser(createUserDto: CreateUserDto) {
		//creating has type checking with dto
		const newUser = this.userRepository.create(createUserDto);
		//return this.repo.save(email, password);//not executing hooks -> no logs
		//create vs save
		//creating is make an instance of entity
		//saving is stroing in db
		return this.userRepository.save(newUser);
	}

	create(intraId: string, password: string) {
		const user = this.userRepository.create( {intraId, password} );
		//how about type checking in saving?
		return this.userRepository.save(user);
		//return this.repo.save(email, password);//not executing hooks -> no logs
		//create vs save
		//creating is make an instance of entity
		//saving is stroing in db
	}
      
	findUserById(id: number) {
		return this.userRepository.findOneById(id);
	}

	findUserByIntraId(intraId: string) {
		//find all of entities with query
		//return array
		return this.userRepository.find({ where: {intraId}});
	}

	async update(id: number, attrs: Partial<User>) {
		const user = await this.findUserById(id);
		if (!user) {
		  throw new NotFoundException('user not found');
		}
		// ######## IMPORTANT ########
		Object.assign(user, attrs);
		return this.userRepository.save(user);
	}

	async remove(id: number) {
		const user = await this.findUserById(id);
		if (!user) {
		  throw new NotFoundException('user not found');
		}
		return this.userRepository.remove(user);
	}

}
