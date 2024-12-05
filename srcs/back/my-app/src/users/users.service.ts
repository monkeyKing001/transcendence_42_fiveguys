import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../typeorm/user.entity';
import { NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserDto } from './dtos/users.dto';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';
import { HttpService } from '@nestjs/axios';
import { UserStatus } from '../typeorm/user.entity';
const scrypt = promisify(_scrypt);

@Injectable()
export class UsersService {
	private readonly logger = new Logger(UsersService.name);
    constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private httpService: HttpService,
  ) {
      this.init();
  }
  async init() {
    const users = await this.userRepository.find();

    for (const user of users) {
      user.status = UserStatus.OFFLINE; // 모든 유저의 status를 OFFLINE으로 변경
      await this.userRepository.save(user); // 변경된 상태를 저장
    }
  }

  
  async createUser(createUserDto: CreateUserDto) {
    //creating has type checking with dto

    var tempNick: string = createUserDto.intraId;
    const salt = randomBytes(8).toString('hex');

    // Hash the salt and the password together
    // async crypto
    const hash = (await scrypt(tempNick, salt, 4)) as Buffer;
    tempNick = 'USER@' + hash.toString('hex');
    createUserDto.nickname = tempNick;
    // Join the hashed result and the salt together
    const newUser = this.userRepository.create(createUserDto);

    //return this.repo.save(email, password);//not executing hooks -> no logs
    //create vs save
    //creating is make an instance of entity
    //saving is stroing in db
    return this.userRepository.save(newUser);
  }

  create(intraId: string) {
    const user = this.userRepository.create({ intraId });
    //how about type checking in saving?
    return this.userRepository.save(user);
    //return this.repo.save(email, password);//not executing hooks -> no logs
    //create vs save
    //creating is make an instance of entity
    //saving is stroing in db
  }

  async findUserById(id: number): Promise<User | null> {
    if (isNaN(id) || id <= 0 || id > 2147483647) {
		return (null);
    }
    const user = await this.userRepository.findOneById(id);
    if (!user) return null;
    return user;
  }

  async findUserByIntraId(findIntraId: string): Promise<User | null> {
    //find all of entities with query
    //return array
    ////console.log('finding Intra ID in service : ' + findIntraId);
    const user = await this.userRepository.findOneBy({ intraId: findIntraId });
    if (!user) return null;
    return user;
  }

  async findUserByNick(findNick: string): Promise<User | null> {
    //console.log('finding User by nickname in use service');
    const user = await this.userRepository.findOneBy({ nickname: findNick });
    if (!user) return null;
    return user;
  }

  async update(id: number, attrs: Partial<User>) {
    if (isNaN(id) || id <= 0 || id > 2147483647) {
		return (null);
    }
    const user = await this.findUserById(id);
    if (!user) {
      throw new NotFoundException('user not found');
    }
    if (attrs.ft_pictureUrl) {
      const url = attrs.ft_pictureUrl;
	  try{
		  const response = await this.httpService
			.get(url, { responseType: 'arraybuffer' })
			.toPromise();
		  user.profilePicture = Buffer.from(response.data, 'binary');
		  user.ft_pictureUrl = attrs.ft_pictureUrl;
	  }
	  catch(error){
		  this.logger.log("Failed to download picture. please try again");
	  }
    }
    if (attrs.profilePicture) {
      //console.log('#########       PROFILE BUFFER INPUT        #########');
      const buffer = Buffer.from(attrs.profilePicture);
      user.profilePicture = buffer;
    }

    Object.assign(user, attrs);
    return this.userRepository.save(user);
  }

  async remove(id: number) {
    if (isNaN(id) || id <= 0 || id > 2147483647) {
		throw new NotFoundException('Invalid Input');
		//return (null);
    }
    const user = await this.findUserById(id);
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return this.userRepository.remove(user);
  }

  async findAllUsers(): Promise<User[] | null> {
    const userList: User[] = await this.userRepository.find();
    if (userList) return userList;
    else return null;
  }

  async addFriends(cur_id: number, fri_id: number) {
    if (isNaN(cur_id) || cur_id <= 0 || cur_id > 2147483647) {
		throw new NotFoundException('Invalid Input');
		//return (null);
    }
    if (isNaN(fri_id) || fri_id <= 0 || fri_id > 2147483647) {
		throw new NotFoundException('Invalid Input');
		//return (null);
    }
    if (cur_id === fri_id) return;
    //find cur user
    const user: User = await this.userRepository.findOne({
      where: { id: cur_id },
      relations: { friends: true, blocks: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    //find cur user
    const friend: User = await this.findUserById(fri_id);
    if (friend && user.friends) {
      user.friends.push(friend);
      //console.log('added friend id : ' + fri_id);
      //console.log(user.friends);
    } else {
      user.friends = [friend];
      //console.log('no fri arr, made new one : ' + fri_id);
      //console.log(user.friends);
    }
    await this.userRepository.save(user);
    return user;
  }

  async removeFriends(cur_id: number, fri_id: number) : Promise<User | null>{
    if (isNaN(cur_id) || cur_id <= 0 || cur_id > 2147483647) {
		throw new NotFoundException('Invalid Input');
		//return (null);
    }
    if (isNaN(fri_id) || fri_id <= 0 || fri_id > 2147483647) {
		throw new NotFoundException('Invalid Input');
		//return (null);
    }
    if (cur_id === fri_id) return;
    //find cur user
    const user: User = await this.userRepository.findOne({
      where: { id: cur_id },
      relations: { friends: true, blocks: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    //find cur user
    const friend: User = await this.findUserById(fri_id);
    if (friend && user.friends) {
      for (var i = user.friends.length - 1; i >= 0; i--) {
        if (user.friends[i].id === friend.id) {
          //console.log('found removing user : ' + friend.id);
          user.friends.splice(i, 1);
          break;
        }
      }
    }
    await this.userRepository.save(user);
    return(user);
  }

  async getUserFriends(cur_id: number): Promise<User[] | null> {
    //find cur user
    const user: User = await this.userRepository.findOne({
      where: { id: cur_id },
      relations: { blocks: true, friends: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    const friends: User[] = user.friends;
    //console.log(friends);
    return friends;
  }

  async addBlocks(cur_id: number, block_id: number) {
    if (isNaN(cur_id) || cur_id <= 0 || cur_id > 2147483647) {
		return (null);
    }
    if (isNaN(block_id) || block_id <= 0 || block_id > 2147483647) {
		return (null);
    }
    if (cur_id === block_id) return;
    //find cur user
    const user: User = await this.userRepository.findOne({
      where: { id: cur_id },
      relations: { friends: true, blocks: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    //find cur user
    const target: User = await this.findUserById(block_id);
	if (!target)
		return;
    if (target && user.blocks) {
      user.blocks.push(target);
      //console.log('added blocks id : ' + block_id);
      //console.log(user.blocks);
    } else {
      user.blocks = [target];
      //console.log('no blocks arr, made new one : ' + block_id);
      //console.log(user.blocks);
    }
    await this.userRepository.save(user);
    return user;
  }

  async removeBlocks(cur_id: number, block_id: number): Promise<void> {
    if (isNaN(cur_id) || cur_id <= 0 || cur_id > 2147483647) {
		return (null);
    }
    if (isNaN(block_id) || block_id <= 0 || block_id > 2147483647) {
		return (null);
    }
    if (cur_id === block_id) return;
    //find cur user
    const user: User = await this.userRepository.findOne({
      where: { id: cur_id },
      relations: { friends: true, blocks: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    //find cur user
    const target: User = await this.findUserById(block_id);
	if (!target)
		return;
    if (target && user.friends) {
      for (var i = user.blocks.length - 1; i >= 0; i--) {
        if (user.blocks[i].id === target.id) {
          //console.log('found removing user : ' + target.id);
          user.blocks.splice(i, 1);
          break;
        }
      }
    }
    await this.userRepository.save(user);
  }

  async getUserBlocks(id: number): Promise<User[] | null> {
    const user: User = await this.userRepository.findOne({
      where: { id: id },
      relations: { friends: true, blocks: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const blocks: User[] = user.blocks;
    //console.log(blocks);
    return blocks;
  }

  //##################
  //##    SOCKET    ##
  //##################
  async findUserBySocketId(socket_id: string): Promise<User | null> {
    const user: User | null = await this.userRepository.findOne({
      where: { socketId: socket_id },
    });
    return user;
  }

  //##################
  //##     GAME     ##
  //##################
  async getTopRankers(limit: number = 20): Promise<User[]> {
    const rankers = await this.userRepository.find({
      order: {
        xp: 'DESC',
      },
      take: limit,
    });
    return rankers;
  }
}
