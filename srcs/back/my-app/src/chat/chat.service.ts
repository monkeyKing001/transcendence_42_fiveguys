import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/typeorm';
import { userDTO, channelDTO } from './dto/chat.dto';
import { Socket } from 'socket.io';
import { ConnectedSocket, MessageBody } from '@nestjs/websockets';


@Injectable()
export class ChatService {
    
    constructor(private readonly usersService: UsersService){};
    private users: userDTO[] = [];
    private channels: channelDTO[] = [];

    async getUsers(): Promise<userDTO[]> {
        return this.users;
    }

    async findUserById(@MessageBody() id: number): Promise<userDTO> {
        let user = this.users.find(u => u.id === id);
        return (user);
    }

    async findUserBySocketId(@MessageBody() skid: string) : Promise<userDTO> {
        let user = this.users.find(u => u.socketid === skid);
        return (user);
    }

    async getChannels(): Promise<channelDTO [] > {
        return this.channels;
    }

    async findChannelByChannelname(@MessageBody() chname: string) : Promise<channelDTO> {
        let channel = this.channels.find(c => c.channelname === chname);
        return channel;
    }

    async findChannelByChannelid(@MessageBody() chid: number) : Promise<channelDTO> {
        let channel = this.channels.find(c => c.channel_id === chid);
        return channel;
    }
  
    async getUserBlocklist(@MessageBody() id: number) : Promise<Map<number, string>>  {
        const block_users : User[] = await this.usersService.getUserBlocks(id);
1
        let   block_list : Map<number, string> = new Map();
       
        for (const blockuser of block_users) {
            block_list.set(blockuser.id, blockuser.nickname);
        }
        return block_list;
    }
}