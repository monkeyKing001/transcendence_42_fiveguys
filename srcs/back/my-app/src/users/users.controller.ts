import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  UseGuards,
  NotFoundException,
  Req,
  Res,
} from '@nestjs/common';
import { User } from '../typeorm/user.entity';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dtos/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/auth-jwt.guard';
import { Request, Response } from 'express';
import PartialJwtGuard from 'src/auth/guards/auth-partial-jwt.guard';
import { currentAuthUser } from 'src/auth/decorators/auth-user.decorator';
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/whoami')
  whoAmI(@currentAuthUser() user: User, @Res() res: Response) {
    //user CurrentUser Decorator -> extract user from request
    res.json(user);
    return user;
  }
  @UseGuards(PartialJwtGuard)
  @Get('/OTPwhoami')
  OTPwhoAmI(@currentAuthUser() user: User, @Res() res: Response) {
    //user CurrentUser Decorator -> extract user from request
    res.json(user);
    return user;
  }

  @Get('id/:id')
  @UseGuards(JwtAuthGuard)
  async findUserById(@Param('id') id: string, @Req() req: Request) {
    const user: User = await this.usersService.findUserById(parseInt(id));
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return user;
  }

  @Get('/intraId/:intraId')
  @UseGuards(JwtAuthGuard)
  async findUserByIntraId(@Param('intraId') intraId: string) {
    const user = await this.usersService.findUserByIntraId(intraId);
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return user;
  }

  @Get('/nickname/:nickname')
  @UseGuards(JwtAuthGuard)
  async findUserByNick(@Param('nickname') nickname: string) {
    const user = await this.usersService.findUserByNick(nickname);
    if (!user) {
      // return null;
      throw new NotFoundException('user not found');
    }
    return user;
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  removeUser(@Param('id') id: string) {
    return this.usersService.remove(parseInt(id));
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard)
  updateUser(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() body: UpdateUserDto,
  ) {
    const contentType = req.headers['content-type'];

    let this_profilePicture;

    if (contentType === 'application/json' && body.profilePicture) {
      this_profilePicture = Buffer.from(body.profilePicture);
      return this.usersService.update(parseInt(id), {
        profilePicture: this_profilePicture,
      });
    }

    return this.usersService.update(parseInt(id), body);
  }

  @Get('findAll')
  @UseGuards(JwtAuthGuard)
  findAllUser() {
    return this.usersService.findAllUsers();
  }

  @Patch('/friends/add/:id')
  @UseGuards(JwtAuthGuard)
  async friendAdd(@currentAuthUser() user: User, @Param('id') id: string) {
    //add freinds
    const ret_user: User = await this.usersService.addFriends(
      user.id,
      parseInt(id),
    );
    if (!ret_user) {
      throw new NotFoundException('User not found');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/friends/remove/:id')
  async friendRemove(@currentAuthUser() user: User, @Param('id') id: string) {
    const ret_user = await this.usersService.removeFriends(
      user.id,
      parseInt(id),
    );
    if (!ret_user) {
      throw new NotFoundException('User not found');
    }
  }

  @Get('/friends/list')
  @UseGuards(JwtAuthGuard)
  async friendsList(@currentAuthUser() user: User): Promise<User[] | null> {
    const friends: User[] | null = await this.usersService.getUserFriends(
      user.id,
    );
    return friends;
  }

  @Patch('/blocks/add/:id')
  @UseGuards(JwtAuthGuard)
  async blockAdd(@currentAuthUser() user: User, @Param('id') id: string) {
    //add freinds
    await this.usersService.addBlocks(user.id, parseInt(id));
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/blocks/remove/:id')
  async blockRemove(@currentAuthUser() user: User, @Param('id') id: string) {
    await this.usersService.removeBlocks(user.id, parseInt(id));
  }

  @Get('/blocks/list')
  @UseGuards(JwtAuthGuard)
  async blocksList(@currentAuthUser() user: User): Promise<User[] | null> {
    const blocks: User[] | null = await this.usersService.getUserBlocks(
      user.id,
    );
    return blocks;
  }
}
