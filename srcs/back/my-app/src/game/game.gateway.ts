import {
  Logger,
  Inject,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import {
  WebSocketServer,
  SubscribeMessage,
  WebSocketGateway,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  WsResponse,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/typeorm';
import { GameService } from './game.service';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';
import { CurrentUserWs } from './decorators/ws.current-user.decorator';
import { ConfigService } from '@nestjs/config';
import { ChatService } from 'src/chat/chat.service';
import { UserStatus } from 'src/typeorm/user.entity';

@WebSocketGateway({
  namespace: 'game',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(GameGateway.name);
  constructor(
    @Inject(UsersService) private usersService: UsersService,
    @Inject(AuthService) private authService: AuthService,
    @Inject(GameService) private gameService: GameService,
    @Inject(ChatService) private readonly chatService: ChatService,
  ) {}
  //@WebSocketServer 데코레이터 부분을 주목해주세요.

  //현재 네임스페이스를 설정했기 때문에 @WebSocketServer 데코레이터가 반환하는 값은 서버 인스턴스가 아닌 네임스페이스 인스턴스입니다.

  //만약 네임스페이스를 설정하지 않았다면 @WebSocketServer 데코레이터가 반환하는 값은 서버 인스턴스가 되고, 그 때는 타입을 다음과 같이 서버 타입을 설정해줘야 합니다.
  //@WebSocketServer() server: Socket;
  @WebSocketServer() nsp: Namespace;

  //execute right after init
  afterInit() {
    this.nsp.adapter.on('create-room', (room) => {
      this.logger.log('ORIGIN : ' + process.env.CORS_ORIGIN);
      this.logger.log(`"Room:${room}" has been created.`);
    });

    this.nsp.adapter.on('join-room', (room, id) => {
      this.logger.log(`"Socket:${id}" has joined "Room:${room}".`);
    });
    this.nsp.adapter.on('leave-room', (room, id) => {
      this.logger.log(`"Socket:${id}" has left "Room:${room}".`);
      const clientSocket = this.nsp.sockets.get(id);
      this.logger.log(
        "leaving socket's room : " + JSON.stringify(clientSocket.rooms),
      );
      this.gameService.destroySession(clientSocket, this.nsp);
      this.gameService.destroyRoom(room, clientSocket, this.nsp);
    });

    this.nsp.adapter.on('delete-room', (roomName, id) => {
      this.logger.log(`"Room:${roomName}"is deleted.`);
    });

    this.logger.log('WebSocketServer init ✅');
  }
  //execute right after connection
  //@UseGuards(WsJwtGuard)
  async handleConnection(@ConnectedSocket() socket: Socket) {
    this.logger.log(`${socket.id} socket connected`);
    //broadcast
    const jwtCookie = socket.handshake.headers.cookie
      ?.split('; ')
      .find((row) => row.startsWith('jwt='))
      ?.split('=')[1];
    if (jwtCookie) {
      const user: User = await this.authService.verifyUser(jwtCookie);
      this.logger.log('found jwt in cookie : ' + jwtCookie);
      //binding user and socket id
      if (!user) return;

      if (user.status !== UserStatus.OFFLINE) {
        this.logger.log(`❌❌❌  ${socket.id} socket blocked  ❌❌❌`);
        socket.emit("connectionBlock");
        return;
        //return new ForbiddenException('Forbidden access');
      }
      this.logger.log('binding socket id with user id ' + user.intraId);

      await this.usersService.update(user.id, { socketId: socket.id });//bind
      await this.authService.updateUserStatusOnline(user);
      await this.gameService.userComeNsp(socket);
      return Boolean(user);
    }
  }

  async handleDisconnect(@ConnectedSocket() socket: Socket) {
    await this.gameService.asySleep(1000);
    this.logger.log(`${socket.id} socket disconnected ❌`);
    const out_user = await this.usersService.findUserBySocketId(socket.id);
    if (!out_user) return;
    await this.authService.updateUserStatusOffline(out_user);
    this.gameService.userOutNsp(socket);
    await this.usersService.update(out_user.id, { socketId: null });
  }

  //	@UseGuards(WsJwtGuard)
  @SubscribeMessage('bindId')
  async bindId(
    @ConnectedSocket() socket: Socket,
    @MessageBody() userId: string,
  ): Promise<WsResponse<unknown>> {
    this.logger.log('binding socket id : ' + socket.id);
    //		socket.emit('bindId', { socketId: socket.id, userId });
    await this.usersService.update(parseInt(userId), { socketId: socket.id });
    socket.emit('message', {
      message: `${socket.id} has been binded with user ID.`,
    });
    return { event: 'bindId', data: { socketId: socket.id, userId } };
  }

  async idnetifyId(
    
    @ConnectedSocket() socket: Socket,
    @CurrentUserWs() userId: string,
  ) {
    this.logger.log('finding socket id : ' + socket.id);
    this.logger.log('userId : ' + userId);
    return userId;
  }

  @SubscribeMessage('amiHost')
  async idnetifyHost(
    @ConnectedSocket() socket: Socket,
    @CurrentUserWs() userId: string,
  ) {
    this.logger.log('finding socket id : ' + socket.id);
    this.logger.log('userId : ' + userId);
    const amihost = await this.gameService.amIhost(socket);
    return amihost;
  }

  @SubscribeMessage('myInfo')
  async idnetifyMyInfo(@ConnectedSocket() socket: Socket) {
    const myInfo = await this.gameService.myInfo(socket);
    return myInfo;
  }

  @SubscribeMessage('other')
  async idnetifyOther(@ConnectedSocket() socket: Socket) {
    const other = await this.gameService.other(socket);
    return other;
  }

  @SubscribeMessage('inGame')
  async inGame(@ConnectedSocket() socket: Socket) {
    console.log('inGame');
    const gameRoomId = await this.gameService.getCurGameRoomId(socket);
    const ret = this.gameService.gameSessions.has(gameRoomId);
    console.log(ret);

    return ret;
  }

  @SubscribeMessage('gameInfo')
  async gameInfo(@ConnectedSocket() socket: Socket) {
    const gameRoomId = await this.gameService.getCurGameRoomId(socket);
    const ret = this.gameService.gameSessions.has(gameRoomId);
    console.log(ret);

    return ret;
  }

  @SubscribeMessage('gameRoomCreate')
  async gameRoomCreate(@ConnectedSocket() socket: Socket) {
    const user: User = await this.usersService.findUserBySocketId(socket.id);
    socket.emit('gameRoomCreate', { socketId: socket.id, userId: user.id });
    return { socketId: socket.id, userId: user.id };
  }

  @SubscribeMessage('gameRoomIn')
  async gameRoomIn(@ConnectedSocket() socket: Socket) {
    const user: User = await this.usersService.findUserBySocketId(socket.id);
    socket.emit('gameRoomIn', { socketId: socket.id, userId: user.id });
    return { socketId: socket.id, userId: user.id };
  }

  @SubscribeMessage('match')
  async pushQueue(@ConnectedSocket() socket: Socket) {
    const user: User = await this.usersService.findUserBySocketId(socket.id);
    const clientSocket: Socket = socket;
    this.logger.log('event : match');
    await this.gameService.pushQueue(clientSocket);
    await this.gameService.monitorQueue(this.nsp);
    socket.emit('matching waiting', { socketId: socket.id, userId: user.id });
    return { socketId: socket.id, userId: user.id };
  }

  @SubscribeMessage('OneOnOne')
  async OneOnOne(@ConnectedSocket() socket: Socket, @MessageBody() body: any) {
    const src: User = await this.usersService.findUserBySocketId(socket.id);
    const target: User = await this.usersService.findUserById(
      parseInt(body.targetId),
    );
    const blocks: Map<number, string> = await this.chatService.getUserBlocklist(
      target.id,
    );
    const cur_game_id = await this.gameService.getCurGameRoomId(socket);
    if (this.gameService.gameSessions.get(cur_game_id)) return -1;
    //src is blocked by target
    if (
      blocks.get(src.id) ||
      target.status !== UserStatus.ONLINE ||
      src.status !== UserStatus.ONLINE
    )
      return -1;
    else {
      const targetSocket = this.nsp.sockets.get(target.socketId);
      const srcSocket = socket;
      await this.gameService.halfSetUpGame(srcSocket, targetSocket, this.nsp);
      //await this.gameService.updateUserStatusOnline(socket);
      return 1;
    }
  }

  @SubscribeMessage('oneOnOneMade')
  async oneOnOneMade(@ConnectedSocket() socket: Socket) {
    return await this.gameService.oneOnOneMade(socket, this.nsp);
  }

  @SubscribeMessage('acceptOneOnOne')
  async acceptOneOnOne(@ConnectedSocket() socket: Socket) {
    return await this.gameService.acceptOneOnOne(socket, this.nsp);
  }

  @SubscribeMessage('denyOneOnOne')
  async denyOneOnOne(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: any,
  ) {
    await this.gameService.denyOneOnOne(socket, this.nsp);
  }

  //#############################################################
  // ##########          AFTER QUEUE COME           #############
  //#############################################################
  @SubscribeMessage('matchQueueOut')
  async popQueue(@ConnectedSocket() socket: Socket) {
    const user: User = await this.usersService.findUserBySocketId(socket.id);
    const client: Socket = socket;
    await this.gameService.popQueue(client);
    socket.emit('matchQueueOut', { socketId: socket.id, userId: user.id });
    return { socketId: socket.id, userId: user.id };
  }

  //#############################################################
  // ##########           AFTER MATCH UP            #############
  //#############################################################

  @SubscribeMessage('setUp')
  async setupRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() gameSetting: any,
  ) {
    this.gameService.echoRoomByGameHost(socket, this.nsp, gameSetting);
  }

  @SubscribeMessage('ready')
  async ready(@ConnectedSocket() socket: Socket) {
    await this.gameService.playerReady(socket, this.nsp);
  }

  @SubscribeMessage('unReady')
  async unready(@ConnectedSocket() socket: Socket, nsp: Namespace) {
    await this.gameService.playerUnready(socket, this.nsp);
  }

  @SubscribeMessage('wait')
  async wait(@ConnectedSocket() socket: Socket) {
    await this.gameService.gameWait(socket, this.nsp);
  }

  @SubscribeMessage('checksocket')
  async checkSocket(@ConnectedSocket() socket: Socket) {
    const out_user = await this.usersService.findUserBySocketId(socket.id);
    if (out_user)
      return 0;
    return 1;
  }


  @SubscribeMessage('gameRoomOut')
  async gameRoomOut(@ConnectedSocket() socket: Socket) {
    //set user's status Online not InGame
    console.log('gameRoomOut');
    await this.gameService.destroyGame(socket, this.nsp);
  }

  @SubscribeMessage('gameSetting')
  async gameSetting(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    game_info: any,
  ) {
    await this.gameService.gameSetting(socket, this.nsp, game_info);
    this.logger.log('game setting completed. Game is really good to go');
  }
  @SubscribeMessage('gameStart')
  async gameStart(@ConnectedSocket() socket: Socket) {
    await this.gameService.gameStart(socket, this.nsp);
  }

  //#############################################################
  // ##########          AFTER GAME START           #############
  //#############################################################

  @SubscribeMessage('pad1')
  async pad1(
    @ConnectedSocket() socket: Socket,

    @MessageBody()
    pad_info: any,
  ) {
    await this.gameService.movePad1(socket, pad_info, this.nsp);
  }

  @SubscribeMessage('pad2')
  async pad2(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    pad_info: any,
  ) {
    await this.gameService.movePad2(socket, pad_info, this.nsp);
  }
}
