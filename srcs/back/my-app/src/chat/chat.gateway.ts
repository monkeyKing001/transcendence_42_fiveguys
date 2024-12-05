import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  userDTO,
  channelDTO,
  chatDTO,
  kickDTO,
  joinDTO,
  opDTO,
  roomDTO,
  gameDTO,
  banDTO
} from './dto/chat.dto';
import { UsersService } from 'src/users/users.service';
import { Inject, Logger } from '@nestjs/common';
import { User } from 'src/typeorm';
import { ChatService } from './chat.service';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  constructor(
    @Inject(UsersService) private readonly usersService : UsersService,
    @Inject(ChatService) private readonly chatService : ChatService,
  ) {}
  private readonly logger = new Logger("ChatGateWay");
  private lastchannel: Map<number, number> = new Map();
  private channel_num :number ;
  
  sendDataToSocket(socket: Socket, data: any) {
    socket.emit('allinfo', data);
  }

  async startSendingAllInfo(user: userDTO) {
    const channels: channelDTO[] = await this.chatService.getChannels();
    user.interval = setInterval(() => {
      this.sendDataToSocket(user.socket, channels);
    }, 1000);
  }


  //**********************************************************************//
  //****************************** init **********************************//
  //**********************************************************************//
  async afterInit() {
    console.log('----------------------------------------');
    console.log('-------------------ININT----------------');
    console.log('----------------------------------------');

    this.channel_num = 0;

    const channel = {
      channelname: '$home',
      host: null as number | null,
      operator: [] as number[],
      users: [] as number[],
      member: 0,
      maxmember: 420,
      option: 'public',
      password: null as string | null,
      mute: false,
      banlist: [] as number[],
      channel_id : this.channel_num++,
      gamestate : false
    };
    const channels: channelDTO[] = await this.chatService.getChannels();

    channels.push(channel);

  }


  //**********************************************************************//
  //**************************** connection ******************************//
  //**********************************************************************//
  handleConnection(@ConnectedSocket() socket: Socket) {
      // //connection은 그냥 체크.
      console.log('----------------------------------------');
      console.log('----------------CONNECTION--------------');
      console.log('Client connected: ', socket.id);
      console.log('----------------------------------------');
  }


  //**********************************************************************//
  //************************** disconnection *****************************//
  //**********************************************************************//
  async handleDisconnect(@ConnectedSocket() socket: Socket) {
    console.log('----------------------------------------');
    console.log('--------------DICONNECTION--------------');
    console.log('Client connected: ', socket.id);
    console.log('----------------------------------------');

    async function asySleep(ms: number): Promise<any> {
      return new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    }

    await asySleep(1000);

    let user = await this.chatService.findUserBySocketId(socket.id);
    if (user) {
      //2초마다 보내는 socket에서 해제
      clearInterval(user.interval);
      // this.connectedSockets.delete(user.id);

      //users에서 지우기.
      const Users: userDTO[] = await this.chatService.getUsers();
      const userIndex = Users.indexOf(user);
      Users.splice(userIndex, 1);

      if (user.channelname !== '$home')
      {
        let channel = await this.chatService.findChannelByChannelname(
          user.channelname
        );
        if (channel) {
          channel.member--;
            //일반 유저목록에서 삭제
          const removeIdx = channel.users.indexOf(user.id);
          if (removeIdx !== -1) {
            channel.users.splice(removeIdx, 1);
          }
            socket.broadcast.to(channel.channelname).emit('update', false); //퇴장 메시지
          }

      }
      else 
      {
        const channels: channelDTO[] = await this.chatService.getChannels();
        let home = channels[0];
        home.member--;
        const removeIdx = home.users.indexOf(user.id);
        if (removeIdx !== -1) {
          home.users.splice(removeIdx, 1);
        }
        socket.broadcast.to(home.channelname).emit('update', false); //퇴장 메시지
      }

      //마지막 user 객체 정리
      user.blocklist = null;
      user = null;
    } 
  }


  //*********************************************************************//
  //***************************  bind  **********************************//
  //*********************************************************************//
  @SubscribeMessage('bind')
  async handlebind(
    @MessageBody() id: number,
    @ConnectedSocket() socket: Socket,
  ) {
    console.log('----------------------------------------');
    console.log('-----------------BIND-------------------');
    console.log('Userid: ', id);
    console.log('SocketId: ', socket.id);
    console.log('----------------------------------------');

    let i = 0;
    let block_list = await this.chatService.getUserBlocklist(id);

    const user: userDTO = {
      socketid: socket.id,
      id: id,
      channelname: null,
      socket: socket,
      interval: null,

      blocklist: block_list,
    };

    const Users: userDTO[] = await this.chatService.getUsers();
    Users.push(user);
    this.startSendingAllInfo(user);
    return (1);
  }


  //*********************************************************************//
  //****************************  chat   ********************************//
  //*********************************************************************//
  @SubscribeMessage('chat')
  async handlechat(
    @MessageBody() chatobj: chatDTO,
    @ConnectedSocket() socket: Socket,
  ) {
    console.log('----------------------------------------');
    console.log('-----------------CHAT-------------------');
    console.log(
      'UserId: ',
      chatobj.id,
      ' Target: ',
      chatobj.target,
      ' Flag: ',
      chatobj.flag,
      ' Msg: ',
      chatobj.msg,
    );
    console.log('----------------------------------------');

    // console.log("123");
    const users: userDTO[] = await this.chatService.getUsers();
    const user = users.find((u) => u.id === chatobj.id);
    if (!user) return;

    const channel_check = await this.chatService.findChannelByChannelname(user.channelname);
    if (channel_check === undefined)
    {
      console.log('----------------------------------------');
      console.log('           channel undefined            ');
      console.log('----------------------------------------');    
      return;
    }

    if (chatobj.flag == 'broad') {
      //* mute일 때 체크
      if (user.id !== channel_check.host)
      {
        if(channel_check.mute)
        {
          console.log('----------------------------------------');
          console.log('                  mute                  ');
          console.log('----------------------------------------');
          return;
        }
      }
      //* 유저가 속한 채널에 채팅.
      console.log('----------------------------------------');
      console.log('             broad chat part            ');
      console.log('----------------------------------------');

      const channel = await this.chatService.findChannelByChannelname(
        user.channelname,
      );
      for (const tmp_userid of channel.users) {
        if (tmp_userid === user.id) continue;

        const userchecking = await this.chatService.findUserById(tmp_userid);
        if (userchecking.blocklist.get(user.id) === undefined) {
          socket.to(userchecking.socketid).emit('chat', chatobj);
        }
      }
    } else {
      //* 귓속말
      console.log('----------------------------------------');
      console.log('             dm chat part               ');
      console.log('----------------------------------------');

      const target = await this.chatService.findUserById(chatobj.target);
      if (!target) return;

      console.log('----------------------------------------');
      console.log('target check :', target.id);
      console.log('----------------------------------------');

      const blocks = target.blocklist;
      const block_check = blocks.get(user.id);
      if (block_check === undefined) {
        if (target && target.id !== user.id) {
          //유저 한명에게 dm보내기.
          socket.to(target.socketid).emit('chat', chatobj);
        }
      } else {
        console.log('----------------------------------------');
        console.log('                  blocked               ');
        console.log('----------------------------------------');
        return;
      }
    }
  }


  //*********************************************************************//
  //****************************  where  ********************************//
  //*********************************************************************//
  @SubscribeMessage('where')
  async handlewhere(
    @MessageBody() userid: number,
    @ConnectedSocket() socket: Socket,
  ) {
    console.log('----------------------------------------');
    console.log('-----------------WHERE------------------');
    console.log('userid: ', userid);
    console.log('----------------------------------------');

    //이후 유저 어디서 체크 & 유저가 있는 위치 확인 후 리플라이 전달.
    let user = await this.chatService.findUserById(userid);
    if (!user) return;
    let channel = await this.chatService.findChannelByChannelname(
      user.channelname,
    );
    console.log('----------------------------------------');
    console.log('-----------------WHERE------------------');
    console.log(JSON.stringify(channel, null, 2));
    console.log('----------------------------------------');
    socket.emit('where', channel);
  }


  //*********************************************************************//
  //***************************  create  ********************************//
  //*********************************************************************//
  @SubscribeMessage('create')
  async handlecreate(
    @MessageBody() room: roomDTO,
    @ConnectedSocket() socket: Socket,
  ): Promise<number> {
    console.log('----------------------------------------');
    console.log('-----------------CREATE-----------------');
    console.log(room);
    console.log('----------------------------------------');

    // 유저 확인
    let user = await this.chatService.findUserById(room.id);
    if (!user) {
      console.log('----------------------------------------');
      console.log('            can not find user           ');
      console.log('----------------------------------------');
      return;
    }
    // home이 아닐 경우 생성 불가.(왜냐면 방 이름이 곧 닉네임이기에)
    let checkChannel = await this.chatService.findChannelByChannelname(
      user.channelname,
    );
    if (checkChannel.channelname !== '$home') {
      console.log('----------------------------------------');
      console.log('             you are not home           ');
      console.log('----------------------------------------');
      return;
    }

    const user_info: User = await this.usersService.findUserById(user.id);

    // 채널 생성
    const newChannel = {
      channelname: user_info.nickname,
      host: room.id,
      operator: [] as number[],
      users: [user.id],
      member: 1,
      maxmember: room.maxmember,
      option: room.option,
      password: room.password,
      mute: false,
      banlist: [] as number[],
      channel_id: this.channel_num++,
      gamestate: false
    };

    //game option시 방제 변경.
    if (newChannel.option === 'game')
    {
      newChannel.channelname = 'game'+ user_info.id;
      newChannel.gamestate = true;
    }

    if (newChannel.option === 'public' || newChannel.option === 'private') {
      newChannel.password = null;
    }
    const channels: channelDTO[] = await this.chatService.getChannels();
    channels.push(newChannel);

    // 이전 채널 객체 정보 업데이트
    let home = await this.chatService.findChannelByChannelname('$home');
    home.member--;
    const removeIdx = home.users.indexOf(user.id);
    if (removeIdx !== -1) {
      home.users.splice(removeIdx, 1);
    }
    if (home.member === 0) {
      home.users = [];
    }

    socket.leave('$home');
    user.channelname = newChannel.channelname;
    socket.join(user.channelname);
    
    //game방이 아닐 때 현재 방정보 업데이트
    if (newChannel.option !== 'game')
    {
      this.lastchannel.set(user.id, newChannel.channel_id);
    }

    socket.emit('create', newChannel);

    socket.broadcast.to(home.channelname).emit('update', false); //퇴장 메시지
    socket.broadcast.to(user.channelname).emit('update', true); //입장 메시지
  }


  //*********************************************************************//
  //***************************  modify  ********************************//
  //*********************************************************************//
  @SubscribeMessage('modify')
  async handlemodify(
    @MessageBody() room: roomDTO,
    @ConnectedSocket() socket: Socket,
  ) : Promise<number> {
    console.log('----------------------------------------');
    console.log('-----------------MODIFY-----------------');
    console.log(room);
    console.log('----------------------------------------');
    const users: userDTO[] = await this.chatService.getUsers();
    let user = users.find((u) => u.id === room.id); //last check
    if (!user) return;
    let modifyingchannel = await this.chatService.findChannelByChannelname(
      user.channelname,
    );
    if (!modifyingchannel) return;

    //예외처리, 채널이 홈이거나 유저가 호스트나 오퍼레이터가 아닐 경우
    if (
      modifyingchannel.host !== user.id ||
      modifyingchannel.channelname === '$home'
    ) {
      if (!modifyingchannel.operator.includes(user.id)) return;
    }

    console.log('----------------------------------------');
    console.log('                 BEFORE                 ');
    console.log(modifyingchannel);
    console.log('----------------------------------------');

    modifyingchannel.maxmember = room.maxmember;
    modifyingchannel.option = room.option;
    if (modifyingchannel.option === 'protected') {
      modifyingchannel.password = room.password;
    } else {
      modifyingchannel.password = null;
    }

    console.log('----------------------------------------');
    console.log('                 AFTER                  ');
    console.log(modifyingchannel);
    console.log('----------------------------------------');

    socket.emit('modify', modifyingchannel);
    return 1;
  }


  //*********************************************************************//
  //****************************  join   ********************************//
  //*********************************************************************//
  @SubscribeMessage('join')
  async handlejoin(
    @MessageBody() joinobj: joinDTO,
    @ConnectedSocket() socket: Socket,
  ) : Promise<number> {

    // 유저 확인
    let user = await this.chatService.findUserById(joinobj.id);
    if (!user) return;

    // 해당 채널이 없거나, 이미 해당 채널일 경우 못들어감.
    const channel = await this.chatService.findChannelByChannelname(
      joinobj.channelname,
    );
    if (!channel) {
      console.log('----------------------------------------');
      console.log('                no room                 ');
      console.log('----------------------------------------');
      return;
    }
    if (channel.channelname === user.channelname) {
      console.log('----------------------------------------');
      console.log('           already in room              ');
      console.log('----------------------------------------');
      return;
    }
    if (channel.banlist.includes(user.id))
    {
      console.log('----------------------------------------');
      console.log('            you are banned              ');
      console.log('----------------------------------------');
      return;
    }

    // 채널 옵션 확인
    if (channel.option === 'private') {
      socket.emit('join', { flag: false, list: null });
      return;
    }

    if (channel.option === 'protected') {
      if (channel.password !== joinobj.password) {
        console.log('----------------------------------------');
        console.log('           wrong password               ');
        console.log('----------------------------------------');
        return;
      }
    }

    // 방 입장.
    if (channel.maxmember - channel.member >= 1) {
      // 이전 채널 정보 업데이트
      let beforeChannel = await this.chatService.findChannelByChannelname(
        user.channelname,
      );
      if (beforeChannel)
      {
        beforeChannel.member--;
          //유저 목록에서 삭제.
          const removeIdx = beforeChannel.users.indexOf(user.id);
          if (removeIdx !== -1) {
            beforeChannel.users.splice(removeIdx, 1);
          }

          //이전 채널에서 유저가 operator였을 경우
          if (beforeChannel.operator.includes(user.id)) {
            const removeIdx = beforeChannel.operator.indexOf(user.id);
            if (removeIdx !== -1) beforeChannel.operator.splice(removeIdx, 1);
          }

          //이전 채널에서 유저가 host였을 경우
          if (beforeChannel.host === user.id) {
            //채널 목록에서 삭제
            const removeChannelIdx = (
              await this.chatService.getChannels()
            ).findIndex((c : channelDTO) => c.channelname === beforeChannel.channelname);
            if (removeChannelIdx !== -1) {
              (await this.chatService.getChannels()).splice(
                removeChannelIdx,
                1,
              );
            }
            for (const checkid of beforeChannel.users) {
              let user = await this.chatService.findUserById(checkid);
              this.handleleave(user.socket);
            }
          }

          socket.leave(user.channelname);
          user.channelname = joinobj.channelname;
          socket.join(user.channelname);
          
          channel.member++; //이동한 채널 명수 늘리기.
          channel.users.push(user.id); //이동한 채널 유저 목록에 추가.
          socket.emit('join', {
            flag: true,

            list: channel.users,
            channelname: user.channelname,
          });

          //game이 아닐 때 업데이트
          if (channel.option !== 'game')
          {
            this.lastchannel.set(user.id, channel.channel_id);
          }
          socket.broadcast.to(user.channelname).emit('update', true); //입장 메시지
    } else {
      console.log('----------------------------------------');
      console.log('           room is fulled               ');
      console.log('----------------------------------------');

      socket.emit('join', { flag: false, list: null, channelname: null });
      return;
      }
    }
    return 1;
  }


  //*********************************************************************//
  //*****************************  op  **********************************//
  //*********************************************************************//
  @SubscribeMessage('op')
  async handleop(@MessageBody() op: opDTO) {
    console.log('----------------------------------------');
    console.log('----------------- OP -------------------');
    console.log('userId: ', op.id, ' targetId: ', op.target);
    console.log('----------------------------------------');

    let user = await this.chatService.findUserById(op.id);
    if (!user) return;

    // 호스트와 op 인지 체크.
    // 호스트 & operator가 op 권한 줄 수 있도록.
    let channel = await this.chatService.findChannelByChannelname(
      user.channelname,
    );
    if (!channel) return;
    if (channel.host !== user.id) {
      if (!channel.operator.includes(user.id)) {
        console.log('----------------------------------------');
        console.log('                 no access              ');
        console.log('----------------------------------------');
        return;
      }
    }

    //타겟이 해당채널에 존재하는지 체크
    if (!channel.users.includes(op.target)) {
      console.log('----------------------------------------');
      console.log('                 no target              ');
      console.log('----------------------------------------');
      return;
    }

    //이미 오퍼레이터인지 체크
    if (channel.operator.includes(op.target)) {
      console.log('----------------------------------------');
      console.log('           target is already op         ');
      console.log('----------------------------------------');
      return;
    }

    //타겟이 host인지 체크
    if (channel.host === op.target) {
      console.log('----------------------------------------');
      console.log('             target is host             ');
      console.log('----------------------------------------');
      return;
    }

    let target = await this.chatService.findUserById(op.target);
    channel.operator.push(target.id);
    target.socket.emit('op', true);

    console.log('----------------------------------------');
    console.log(channel);
    console.log('----------------------------------------');
  }

  //*********************************************************************//
  //************************  allchannel   ******************************//
  //*********************************************************************//
  @SubscribeMessage('allchannel')
  async handleallchannel(@ConnectedSocket() socket: Socket) {
    console.log('----------------------------------------');
    console.log('--------------ALLCHANNEL----------------');
    console.log('----------------------------------------');

    socket.emit('allchannel', await this.chatService.getChannels());
  }

  //*********************************************************************//
  //****************************  kick   ********************************//
  //*********************************************************************//
  @SubscribeMessage('kick')
  async handlekick(
    @MessageBody() kickobj: kickDTO,
    @ConnectedSocket() socket: Socket,
  ) {
    console.log('----------------------------------------');
    console.log('-----------------KICK-------------------');
    console.log('userId: ', kickobj.id, ' targetId: ', kickobj.target);
    console.log('----------------------------------------');

    let user = await this.chatService.findUserById(kickobj.id);
    if (!user) return;

    let channel = await this.chatService.findChannelByChannelname(
      user.channelname,
    );
    if (!channel) return;

    // 유저가 호스트 혹은 오퍼레이터가 아닐 경우
    if (channel.host !== user.id) {
      if (!channel.operator.includes(user.id)) {
        console.log('----------------------------------------');
        console.log('                 no access              ');
        console.log('----------------------------------------');
        return;
      }
    }

    // 타겟이 존재하는지, 추방 대상이 현재 채널에 존재하는지.
    let target = await this.chatService.findUserById(kickobj.target);

    if (!target) return;
    if (user.channelname !== target.channelname) {
      console.log('----------------------------------------');
      console.log('                 no target              ');
      console.log('----------------------------------------');
      return;
    }

    // 타켓이 본인인지.
    if (user.id === kickobj.target) {
      console.log('----------------------------------------');
      console.log('               no kick myself           ');
      console.log('----------------------------------------');
      return;
    }

    // target이 호스트일 경우 그냥 파.
    if (channel.host === target.id) {
      console.log('----------------------------------------');
      console.log('              target is host            ');
      console.log('----------------------------------------');
      return;
    }

    // 추방 대상을 해당 채널에서 제거
    const removeIdx = channel.users.indexOf(kickobj.target);
    if (removeIdx !== -1) {
      channel.users.splice(removeIdx, 1); // 유저목록에서 삭제
      channel.member--; // 이전 채널 멤버 수 줄이기

      //만약 타겟이 오퍼레이터였을 경우.
      if (channel.operator.includes(target.id)) {
        const removeIdx = channel.operator.indexOf(kickobj.target);
        if (removeIdx !== -1) channel.operator.splice(removeIdx, 1);
      }

      target.socket.leave(target.channelname);
      target.channelname = '$home'; // 추방된 사용자는 home 채널로 이동
      target.socket.join(target.channelname);

      let home = await this.chatService.findChannelByChannelname(
        target.channelname,
      );
      home.member++;
      home.users.push(target.id);
      target.socket.emit('kick', true);

      this.lastchannel.set(target.id, 0);

      socket.broadcast.to(channel.channelname).emit('update', false); //퇴장 메시지
      socket.broadcast.to('$home').emit('update', true); //입장 메시지
    }
  }

  //*********************************************************************//
  //****************************  home   ********************************//
  //*********************************************************************//
  @SubscribeMessage('home')
  async handlehome(
    @MessageBody() id: number,
    @ConnectedSocket() socket: Socket,
  ) {
    console.log('----------------------------------------');
    console.log('-----------------HOME-------------------');
    console.log('userId: ', id);
    console.log('----------------------------------------');

    // 유저 확인
    let user = await this.chatService.findUserById(id);
    if (!user) return;

    // 이전 채널 정보 업데이트
    let beforeChannel = await this.chatService.findChannelByChannelname(
      user.channelname,
    );
    if (!beforeChannel)
      return;
    console.log('before', beforeChannel);
    if (beforeChannel.channelname === '$home') {
      console.log('----------------------------------------');
      console.log('         you are alread home            ');
      console.log('----------------------------------------');
      return;
    }

    beforeChannel.member--;
      //유저 목록에서 삭제.
    const removeIdx = beforeChannel.users.indexOf(user.id);
    if (removeIdx !== -1) {
      beforeChannel.users.splice(removeIdx, 1);
    }
      //이전 채널에서 유저가 operator였을 경우
    if (beforeChannel.operator.includes(user.id)) {
      const removeIdx = beforeChannel.operator.indexOf(user.id);
      if (removeIdx !== -1) beforeChannel.operator.splice(removeIdx, 1);
    }

      //이전 채널에서 유저가 host였을 경우
    if (beforeChannel.host === user.id) {
      //채널 목록에서 삭제
      const removeChannelIdx = (
        await this.chatService.getChannels()
      ).findIndex((c : channelDTO) => c.channelname === beforeChannel.channelname);
      if (removeChannelIdx !== -1) {
        const channels: channelDTO[] = await this.chatService.getChannels();
        channels.splice(removeChannelIdx, 1);
      }
      for (const checkid of beforeChannel.users) {
          let user = await this.chatService.findUserById(checkid);
          this.handleleave(user.socket);
      }
    }

    let channel = await this.chatService.findChannelByChannelname('$home');
    socket.leave(user.channelname);
    user.channelname = channel.channelname;
    socket.join(user.channelname);

    channel.member++; //이동한 채널 명수 늘리기.
    channel.users.push(user.id); //이동한 채널 유저 목록에 추가.
    socket.emit('join', {
      flag: true,
      list: channel.users,
      channelname: user.channelname,
    });

    this.lastchannel.set(user.id, 0);
    socket.broadcast.to(user.channelname).emit('update', true); //입장 메시지

    console.log('----------------------------------------');
    console.log('---------------ALL CHANNELS-------------');
    console.log(await this.chatService.getChannels()); //  마지막에 채널들 다 잘 수정되었는지 확인
    console.log('----------------------------------------');
  }


  //*********************************************************************//
  //****************************  gamehome   ****************************//
  //*********************************************************************//
  @SubscribeMessage('gamehome')
  async handlegamehome(
    @MessageBody() id: number,
    @ConnectedSocket() socket: Socket,
  ) {
    console.log('----------------------------------------');
    console.log('-----------------HOME-------------------');
    console.log('userId: ', id);
    console.log('----------------------------------------');

    // 유저 확인
    let user = await this.chatService.findUserById(id);
    if (!user) return;

    // 이전 채널 정보 업데이트
    let beforeChannel = await this.chatService.findChannelByChannelname(
      user.channelname,
    );
    if (!beforeChannel)
      return;
    console.log('before', beforeChannel);
    if (beforeChannel.channelname === '$home') {
      console.log('----------------------------------------');
      console.log('         you are alread home            ');
      console.log('----------------------------------------');
      return;
    }

    beforeChannel.member--;
      //유저 목록에서 삭제.
    const removeIdx = beforeChannel.users.indexOf(user.id);
    if (removeIdx !== -1) {
      beforeChannel.users.splice(removeIdx, 1);
    }


    let channel = await this.chatService.findChannelByChannelname('$home');
    socket.leave(user.channelname);
    user.channelname = channel.channelname;
    socket.join(user.channelname);

    channel.member++; //이동한 채널 명수 늘리기.
    channel.users.push(user.id); //이동한 채널 유저 목록에 추가.
    socket.emit('join', {
      flag: true,
      list: channel.users,
      channelname: user.channelname,
    });

    socket.broadcast.to(user.channelname).emit('update', true); //입장 메시지

    console.log('----------------------------------------');
    console.log('---------------ALL CHANNELS-------------');
    console.log(await this.chatService.getChannels()); //  마지막에 채널들 다 잘 수정되었는지 확인
    console.log('----------------------------------------');
  }


  //*********************************************************************//
  //********************* block list update  ****************************//
  //*********************************************************************//
  @SubscribeMessage('blocklistupdate')
  async handlemutelist(@MessageBody() id: number) {
    console.log('----------------------------------------');
    console.log('---------BLOCK LIST UPDATE--------------');

    let user = await this.chatService.findUserById(id);
    if (!user) return;

    user.blocklist = null;
    user.blocklist = await this.chatService.getUserBlocklist(id);

    console.log(user.blocklist);
    console.log('----------------------------------------');
  }


  //*********************************************************************//
  //******************************  game  *******************************//
  //*********************************************************************//
  @SubscribeMessage('gamechatroom')
  async handlegameset(@MessageBody() gamers: gameDTO){
    console.log('----------------------------------------');
    console.log('-----------------GAME SET---------------');
    // console.log('hostId : ', gamers.host);
    // console.log('targetId : ', gamers.target);
    console.log('----------------------------------------');

    let host = await this.chatService.findUserById(gamers.host);
    let target = await this.chatService.findUserById(gamers.target);

    //여기서 이전 채널 업데이트.
    const host_channel = await this.chatService.findChannelByChannelname(host.channelname);
    this.lastchannel.set(host.id, host_channel.channel_id);

    const target_channel = await this.chatService.findChannelByChannelname(target.channelname);
    this.lastchannel.set(target.id, target_channel.channel_id);

    if (host.channelname !== '$home') {
      await this.handlegamehome(host.id, host.socket);
    }
    if (target.channelname !== '$home') {
      await this.handlegamehome(target.id, target.socket);
    }

    const ret = await this.handlecreate(
      {
        id: host.id,
        maxmember: 2,
        option: 'game',
        password: null,
      },
      host.socket
    );
    if (ret === 1)
      console.log(ret);
    host.socket.emit('oneOnOne', '');
    
    const ret1 = await this.handlejoin(
      {
        id: target.id,
        channelname: 'game' + host.id,
        password: null,
      },
      target.socket
    );
    if (ret1 === 1)
      console.log(ret1);

    const ret2 = await this.handlemodify(
      {
        id: host.id,
        maxmember: 2,
        option: 'private',
        password: null,
      },
      host.socket
    );
    if (ret2 === 1)
      console.log(ret2);
    return 1;
  }


  //*********************************************************************//
  //******************************  mute  *******************************//
  //*********************************************************************//
  @SubscribeMessage('mute')
  async handlemute(@MessageBody() id: number) {
    const user = await this.chatService.findUserById(id);
    const channel = await this.chatService.findChannelByChannelname(user.channelname);

    const check: number = channel.channel_id;

    if (channel === undefined)
    {
      return (1);
    }

    if (channel.mute)
    {
      return (2);
    }

    if (channel.host === user.id)
    {
      channel.mute = true;
      
      setTimeout(async () => {
        const channel_check = await this.chatService.findChannelByChannelid(check);
        if (channel_check !== undefined) {
          channel_check.mute = false;
        }
      }, 30000);
      return (0);
    }
    return (1);
  }


  //*********************************************************************//
  //******************************  ban  ********************************//
  //*********************************************************************//
  @SubscribeMessage('ban')
  async handleban(@MessageBody() ban: banDTO) {
    const user = await this.chatService.findUserById(ban.user);
    const target = await this.chatService.findUserById(ban.target);
    const channel = await this.chatService.findChannelByChannelname(user.channelname);

    if (user.id !== channel.host)
    {
      if (!channel.operator.includes(user.id))
      {
        console.log("         no access         ");
        return (1);
      }
    }

    if (target.id === channel.host)
    {
      console.log("         target is host         ");
      return (1);
    }

    await this.handlekick({
      id: user.id,
      target: target.id
    }, user.socket);
    
    channel.banlist.push(target.id);
    return (0);
  }


  //*********************************************************************//
  //****************************  leave  ********************************//
  //*********************************************************************//
  @SubscribeMessage('leave')
  async handleleave(@ConnectedSocket() socket: Socket,){
    const user = await this.chatService.findUserBySocketId(socket.id);
    if (!user) return;
    
    socket.leave(user.channelname);
    user.channelname = '$home';
    socket.join('$home');
    const home = await this.chatService.findChannelByChannelid(0);
    home.member++;
    home.users.push(user.id);

    socket.emit('join', {
      flag: true,
      list: home.users,
      channelname: user.channelname,
    });

    socket.broadcast.to(user.channelname).emit('update', true);
    this.lastchannel.set(user.id,0);
  }


  @SubscribeMessage('leavegame')
  async handleleavegame(@ConnectedSocket() socket : Socket){
    const user = await this.chatService.findUserBySocketId(socket.id);
    if (!user) return;
    socket.leave(user.channelname);
    const channelid = this.lastchannel.get(user.id);
    const channel = await this.chatService.findChannelByChannelid(channelid);
    const beforeChannel = await this.chatService.findChannelByChannelname(user.channelname);
    if (beforeChannel)
    {
      if (beforeChannel.host === user.id)
      { 
        const removeChannelIdx = (
          await this.chatService.getChannels()
        ).findIndex((c : channelDTO) => c.channelname === beforeChannel.channelname);
        if (removeChannelIdx !== -1) {
          (await this.chatService.getChannels()).splice(
            removeChannelIdx,
            1,
          );
        }
      }
    } 
    if (channel === undefined)
    {
      this.handleleave(socket);
      return;
    }
    if (channel.users.includes(user.id))
    {
      return;
    }
    user.channelname = channel.channelname;
    socket.join(channel.channelname);
    channel.member++;
    channel.users.push(user.id);


    socket.emit('join', {
      flag: true,
      list: channel.users,
      channelname: channel.channelname,
    });

    socket.broadcast.to(channel.channelname).emit('update', true);
    this.lastchannel.set(user.id,channelid);
  }


  //*********************************************************************//
  //****************************  moving  *******************************//
  //*********************************************************************//
  @SubscribeMessage('moving')
  async handlemoving(@ConnectedSocket() socket: Socket,) {
    const user = await this.chatService.findUserBySocketId(socket.id);
    if (user.channelname !== null)
      return;
    const channel_id = this.lastchannel.get(user.id);

    if (channel_id === undefined)
    {      
      const channel = await this.chatService.findChannelByChannelid(0);
      user.channelname = '$home';
      user.socket.join(user.channelname);

      channel.member++; //이동한 채널 명수 늘리기.
      channel.users.push(user.id); //이동한 채널 유저 목록에 추가.
      user.socket.emit('join', {
        flag: true,
        list: channel.users,
        channelname: user.channelname,
      });
      user.socket.broadcast.to(user.channelname).emit('update', true); //입장 메시지    
      this.lastchannel.set(user.id, 0);
      return ;
    }
    else
    {
      const channel = await this.chatService.findChannelByChannelid(channel_id);
      if (!channel)
      {
        const channel = await this.chatService.findChannelByChannelid(0);
        user.channelname = '$home';
        user.socket.join(user.channelname);

        channel.member++; //이동한 채널 명수 늘리기.
        channel.users.push(user.id); //이동한 채널 유저 목록에 추가.
        user.socket.emit('join', {
          flag: true,
          list: channel.users,
          channelname: user.channelname,
        });
        user.socket.broadcast.to(user.channelname).emit('update', true); //입장 메시지    
        this.lastchannel.set(user.id, 0);
        return;
      }
      if (user.channelname === channel.channelname)
        return;
      user.channelname = channel.channelname;
      console.log("user.channelname : ", user.channelname);
      user.socket.join(user.channelname);
      channel.member++; //이동한 채널 명수 늘리기.
      channel.users.push(user.id); //이동한 채널 유저 목록에 추가.
      user.socket.emit('join', {
        flag: true,
        list: channel.users,
        channelname: user.channelname,
      });
      user.socket.broadcast.to(user.channelname).emit('update', true); //입장 메시지
      this.lastchannel.set(user.id, channel.channel_id);
    }
  }
}
