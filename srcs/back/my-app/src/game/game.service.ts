import { Injectable, Logger } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from 'src/users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User, GamePlayer, Games } from 'src/typeorm';
import { Server, Socket, Namespace } from 'socket.io';
import { ConnectedSocket } from '@nestjs/websockets';
import { Repository } from 'typeorm';
import {
  Game,
  Player1,
  Player2,
  PlayerStatus,
  PadItem,
  Ball,
  Obstacle,
  Collidable,
  GameStatus,
} from './classes/game.class';
import { UserStatus } from 'src/typeorm/user.entity';
import { CreateGamePlayerDto } from './dtos/create-gamePlayer.dto';
import { Result } from './interfaces/game.interface';
import { response } from 'express';

@Injectable()
export class GameService {
  private readonly logger = new Logger('GameService');
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    @InjectRepository(Games) private gamesRepository: Repository<Games>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(GamePlayer)
    private gamePlayerRepository: Repository<GamePlayer>,
  ) {
    this.queue = new Map();
    this.usersSockets = new Map();
    this.gameSessions = new Map();
    this.newInvitationList = new Map();
  }
  public queue: Map<string, Socket>; //waiting Queue <K: socketId,  V: socket>
  public usersSockets: Map<string, Socket>; //waiting Queue <K: socketId,  V: socket>
  public gameSessions: Map<string, Game>; //game class instance Queue. K: V:
  public newInvitationList: Map<
    number,
    { userIds: number[]; userSocket: Socket }[]
  >;

  async pushQueue(clientSocket: Socket) {
    const client_user: User = await this.usersService.findUserBySocketId(
      clientSocket.id,
    );
    //cannot find socket id User.
    if (!client_user) {
      //not
      this.logger.log('cannot find user');
      return;
    }
    this.queue.set(clientSocket.id, clientSocket);
    await this.updateUserStatusInGame(clientSocket);
    this.logger.log('cur size : ' + this.queue.size);
    console.log('pushing in queue user id : ' + client_user.id);
  }

  async popQueue(clientSocket: Socket) {
    if (!clientSocket) return;
    const client_user: User | null = await this.usersService.findUserBySocketId(
      clientSocket.id,
    );
    //cannot find socket id User.
    if (!client_user) {
      //not
      return;
      //throw new Error("NotFoundException : cannot find user");
    }
    if (this.queue.get(clientSocket.id)) {
      this.queue.delete(clientSocket.id);
      await this.updateUserStatusOnline(clientSocket);
      console.log('poping in queue user id : ' + client_user.id);
    }
  }

  async setUpGame(client1: Socket, client2: Socket, nsp: Namespace) {
    const user1: User = await this.usersService.findUserBySocketId(client1.id);
    const user2: User = await this.usersService.findUserBySocketId(client2.id);
    const player1: Player1 = new Player1(
      user1.socketId,
      user1.id,
      user1.nickname,
    );
    const player2: Player2 = new Player1(
      user2.socketId,
      user2.id,
      user2.nickname,
    );
    const gameInfo = new Game(player1, player2);
    gameInfo.gameStatus = GameStatus.Waiting;
    gameInfo.gameID = user1.socketId;
    gameInfo.gameService = this;

    client1.join(gameInfo.gameID);
    client2.join(gameInfo.gameID);
    nsp.to(user1.socketId).emit('client', 0);
    nsp.to(user2.socketId).emit('client', 1);
    nsp
      .to(gameInfo.gameID)
      .emit('matchInfo', {
        gameId: gameInfo.gameID,
        host: user1,
        guest: user2,
      });
    /* add that game info to the gameSessions */
    this.gameSessions.set(gameInfo.gameID, gameInfo);
    this.logger.log('created game session, size : ' + this.gameSessions.size);

    const guestSocket: Socket = nsp.sockets.get(gameInfo.guest.socketID);
    const hostSocket: Socket = nsp.sockets.get(gameInfo.host.socketID);
    //flag as in game
    await this.updateUserStatusInGame(guestSocket);
    await this.updateUserStatusInGame(hostSocket);

    //		/* send all active game sessions */
    //		const gameSessions = [];
    //		this.gameSessions.forEach((value: Game) => {
    //		  if (value.gameStatus === GameStatus.Playing) {
    //			gameSessions.push(value);
    //		  }
    //		});
  }
  async asySleep(ms: number): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  async monitorQueue(nsp: Namespace) {
    if (this.queue.size === 2) {
      await this.matchUp(
        this.queue.get(Array.from(this.queue.keys())[0]),
        this.queue.get(Array.from(this.queue.keys())[1]),
        nsp,
      );
    }
  }

  async halfSetUpGame(client1: Socket, client2: Socket, nsp: Namespace) {
    const user1: User = await this.usersService.findUserBySocketId(client1.id);
    const user2: User = await this.usersService.findUserBySocketId(client2.id);
    const player1: Player1 = new Player1(
      user1.socketId,
      user1.id,
      user1.nickname,
    );
    const player2: Player2 = new Player1(
      user2.socketId,
      user2.id,
      user2.nickname,
    );
    const gameInfo = new Game(player1, player2);
    gameInfo.gameStatus = GameStatus.Waiting;
    gameInfo.gameID = user1.socketId;
    gameInfo.gameService = this;
    const guestSocket: Socket = nsp.sockets.get(gameInfo.guest.socketID);
    const hostSocket: Socket = nsp.sockets.get(gameInfo.host.socketID);
    hostSocket.join(gameInfo.gameID);
    guestSocket.join(gameInfo.gameID);
    //flag as in game
    await this.updateUserStatusInGame(guestSocket);
    await this.updateUserStatusInGame(hostSocket);
    this.gameSessions.set(gameInfo.gameID, gameInfo);
    this.logger.log("wating for target's game Join " + this.gameSessions.size);
    const targetSocket: Socket = this.usersSockets.get(player2.socketID);
    await this.OneOnOneNoti(user1.id, user2.id, nsp);
    //update user1 , user2 as in Game
  }

  async matchUp(player1: Socket, player2: Socket, nsp: Namespace) {
    await this.setUpGame(
      this.queue.get(Array.from(this.queue.keys())[0]),
      this.queue.get(Array.from(this.queue.keys())[1]),
      nsp,
    );
    this.queue.delete(player1.id);
    this.queue.delete(player2.id);
    //make a game.
    //match Info emit to player1
    //match Info emit to player2
  }

  async updateGameSettingInfo(body: any) {
    const cur_game: Game = this.gameSessions.get(body.gameId);
    //update gameInfo

    //emit to two players
  }

  async getCurGameRoomId(client: Socket) {
    const room = Array.from(client.rooms);
    if (room.length == 1) return room[0];
    else return room[1];
  }

  async updatePlayerInfo(client: Socket, body: Partial<Game>) {
    const cur_game_id = await this.getCurGameRoomId(client);
    const cur_game = this.gameSessions.get(cur_game_id);
    let cur_player = cur_game_id === client.id ? cur_game.host : cur_game.guest;
    this.logger.log('update game info of player' + cur_player.socketID);
  }

  async userComeNsp(client: Socket) {
    this.usersSockets.set(client.id, client);
  }

  async userOutNsp(client: Socket) {
    this.logger.log('user has out of game ' + client.id);
    const cur_game_id = await this.getCurGameRoomId(client);
    const cur_game = this.gameSessions.get(cur_game_id);
    this.usersSockets.delete(client.id);
  }

  async updateGameRoomInfo(client: Socket, body: any) {}

  async updateUserStatusInGame(client: Socket | null) {
    if (client !== null) {
      const user: User = await this.usersService.findUserBySocketId(client.id);
      if (!user) return;
      this.usersService.update(user.id, { status: UserStatus.GAME });
    }
  }

  async updateUserStatusOnline(client: Socket | null) {
    if (client !== null) {
      const user: User = await this.usersService.findUserBySocketId(client.id);
      if (!user) return;
      this.authService.updateUserStatusOnline(user);
    }
  }

  async getGameStatForPlayer(userID: number): Promise<Result[]> {
    const gameStats: GamePlayer[] = await this.gamePlayerRepository
      .createQueryBuilder('gamePlayer')
      .leftJoinAndSelect('gamePlayer.user', 'user')
      .leftJoinAndSelect('gamePlayer.game', 'game')
      .select([
        'gamePlayer.id',
        'gamePlayer.score',
        'gamePlayer.winner',
        'user.intraId',
        'game.id',
        'game.date',
        'user.nickname',
      ])
      .orderBy('game.date', 'ASC')
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .from(Games, 'game')
          .leftJoin('game.gamePlayer', 'gamePlayer')
          .leftJoin('gamePlayer.user', 'user')
          .select(['game.id'])
          .where('user.id = :id', { id: userID })
          .getQuery();
        return 'game.id IN ' + subQuery;
      })
      .getMany();

    let results: Result[] = [];
    for (let i: number = 0; i < gameStats.length - 1; i++) {
      if (gameStats[i].game.id == gameStats[i + 1].game.id) {
        //console.log(gameStats[i].user);
        let result = {
          key: i,
          date: gameStats[i].game.date.toDateString(),
          winner: gameStats[i].winner
            ? gameStats[i].user.intraId
            : gameStats[i + 1].user.intraId,
          winnerNickName: gameStats[i].winner
            ? gameStats[i].user.nickname
            : gameStats[i + 1].user.nickname,
          loser: gameStats[i].winner
            ? gameStats[i + 1].user.intraId
            : gameStats[i].user.intraId,
          loserNickName: gameStats[i].winner
            ? gameStats[i + 1].user.nickname
            : gameStats[i].user.nickname,
          scoreWinner: gameStats[i].winner
            ? gameStats[i].score
            : gameStats[i + 1].score,
          scoreLoser: gameStats[i].winner
            ? gameStats[i + 1].score
            : gameStats[i].score,
        };
        results.push(result);
      }
    }
    // console.log('results: ', results);

    return results;
  }
  async OneOnOneNoti(srcUserId: number, targetUserId: number, nsp: Namespace) {
    const targetUser: User = await this.usersService.findUserById(targetUserId);
    const srcUser: User = await this.usersService.findUserById(srcUserId);
    //cannot find user`
    this.logger.log('OneOnOneNoti111');
    if (!targetUser || !srcUser) {
      this.logger.log('cannot find target user of id : ' + targetUserId);
    }
    //Not ONLINE
    if (targetUser.status === UserStatus.OFFLINE) {
      this.logger.log('Target User is OFFLINE. id: ' + targetUserId);
      return;
    }
    //cannot find socket
    const targetSocket: Socket = this.usersSockets.get(targetUser.socketId);
    if (targetSocket) {
      this.logger.log('OneOnOneNoti');
      targetSocket.emit('OneOnOneNoti', srcUser);
    }
  }

  async acceptOneOnOne(client: Socket, nsp: Namespace) {
    const cur_game_id = await this.getCurGameRoomId(client);
    const cur_game = this.gameSessions.get(cur_game_id);
    if (!cur_game) return false;
    return true;
  }
  async oneOnOneMade(client: Socket, nsp: Namespace) {
    const cur_game_id = await this.getCurGameRoomId(client);
    const cur_game = this.gameSessions.get(cur_game_id);
    if (!cur_game) return;
    nsp.to(cur_game_id).emit('client', 0);
    nsp.to(cur_game_id).emit('client', 1);
    const srcUser: User = await this.usersService.findUserBySocketId(
      cur_game.player1.socketID,
    );
    const targetUser: User = await this.usersService.findUserBySocketId(
      cur_game.player2.socketID,
    );
    nsp
      .to(cur_game.gameID)
      .emit('matchInfo', {
        gameId: cur_game.gameID,
        host: srcUser,
        guest: targetUser,
      });
    this.logger.log('accepted One on One : ' + this.gameSessions.size);
  }

  async denyOneOnOne(socket: Socket, nsp: Namespace) {
    this.destroyGame(socket, nsp);
  }

  //#############################################################
  // ##########           AFTER MATCH UP            #############
  //#############################################################

  async amIhost(client: Socket) {
    const cur_game_id = await this.getCurGameRoomId(client);
    if (cur_game_id === null) return -1;
    if (client.id === cur_game_id) return 0;
    return 1;
  }
  async myInfo(client: Socket) {
    const user: User = await this.usersService.findUserBySocketId(client.id);
    if (user === null) return -1;
    return user.nickname;
  }

  async other(client: Socket) {
    const cur_game_id = await this.getCurGameRoomId(client);
    if (cur_game_id === null) return -1;
    const cur_game = this.gameSessions.get(cur_game_id);
    if (!cur_game) return;
    if (client.id === cur_game.player1.socketID)
      return cur_game.player2.nickname;
    return cur_game.player1.nickname;
  }

  async echoRoomByGameHost(client: Socket, nsp: Namespace, body: any) {
    const room = Array.from(client.rooms);
    console.log(room);
    const gameRoom = this.gameSessions.get(client.id);
    if (gameRoom && gameRoom.gameID === client.id)
      nsp.to(client.id).emit('setupReply', body);
    //		client.emit('setupReply', body);
  }

  async playerReady(client: Socket, nsp: Namespace) {
    const cur_game_id = await this.getCurGameRoomId(client);
    const cur_game = this.gameSessions.get(cur_game_id);
    if (!cur_game) return;
    let cur_player = cur_game_id === client.id ? cur_game.host : cur_game.guest;
    cur_player.playerStatus = PlayerStatus.Ready;
    cur_game.readyNum++;
    nsp
      .to(cur_game_id)
      .emit('ready', { message: `Player ${cur_player.socketID} is ready` });
    this.logger.log('Ready! from ' + cur_player.socketID);
    if (cur_game.readyNum == 2) {
      this.logger.log('game is good to go!');
      cur_game.gameStatus = GameStatus.AllReady;
      nsp.to(cur_game_id).emit('allReady');
    }
  }

  async playerUnready(client: Socket, nsp: Namespace) {
    const cur_game_id = await this.getCurGameRoomId(client);
    const cur_game = this.gameSessions.get(cur_game_id);
    if (!cur_game) return;
    let cur_player = cur_game_id === client.id ? cur_game.host : cur_game.guest;
    if (cur_game.readyNum == 2) {
      cur_game.gameStatus = GameStatus.Waiting;
    }
    if (cur_game.readyNum != 0) {
      cur_game.readyNum--;
    }
    cur_player.playerStatus = PlayerStatus.Waiting;
  }
  async socketGetter(socketId: string) {
    const returnSocket: Socket = this.usersSockets.get(socketId);
    return returnSocket;
  }

  async gameSetting(client: Socket, nsp: Namespace, game_info: any) {
    const cur_game_id = await this.getCurGameRoomId(client);
    const cur_game = this.gameSessions.get(cur_game_id);
    const host: Player2 = cur_game.host;
    const guest: Player2 = cur_game.guest;

    //update player, game status as playing
    cur_game.gameStatus = GameStatus.Playing;
    guest.playerStatus = PlayerStatus.Playing;
    host.playerStatus = PlayerStatus.Playing;
    //console.log(game_info.game);
    //const guestSocket : Socket = await this.socketGetter(guest.socketID);
    //const hostSocket : Socket = await this.socketGetter(host.socketID);

    //nsp.to(cur_game_id).emit('gameStart');
    //set up game resources
    cur_game.ball.isEqual(game_info.ball);
    cur_game.board_x = game_info.board_x;

    cur_game.board_y = game_info.board_y;

    //set up pad resources
    for (let i = 0; i < 2; i++) {
      cur_game.pad.push(new PadItem(0, 0, 0, 0, '0', 0));
      cur_game.pad[i].isEqual(game_info.pad[i]);
    }
    //set up obstacles
    for (let i: number = 0; i < game_info.obs.length; i++) {
      cur_game.obstacles.push(new Obstacle(0, 0, 0, 0));
      cur_game.obstacles[i].isEqual(game_info.obs[i]);
    }

    //		console.log(cur_game.obstacles);
    //		console.log(cur_game.ball);
    //		console.log(cur_game.pad);
    //update ball direction.
    cur_game.updatedirection(cur_game.ball);
    console.log('setting');
    nsp.to(cur_game_id).emit('goodtogo', '');

    //draw game elements by 20ms
  }

  async gameWait(client: Socket, nsp: Namespace) {
    const cur_game_id = await this.getCurGameRoomId(client);
    const cur_game = this.gameSessions.get(cur_game_id);

    nsp
      .to(cur_game_id)
      .emit('gameSetting', {
        pad: cur_game.pad,
        ball: cur_game.ball,
        obs: cur_game.obstacles,
        board_x: cur_game.board_x,
        board_y: cur_game.board_y,
      });
    let count = 2;
    cur_game.count_intervalId = setInterval(() => {
      nsp.to(cur_game_id).emit('count', count);
      count--;
    }, 1000);
  }

  async gameStart(client: Socket, nsp: Namespace) {
    console.log('start');

    const cur_game_id = await this.getCurGameRoomId(client);
    const cur_game = this.gameSessions.get(cur_game_id);
    clearInterval(cur_game.count_intervalId);
    cur_game.intervalId = setInterval(() => {
      cur_game.pong(nsp);

    //draw game elements by 20ms
      nsp.to(cur_game_id).emit('draw', cur_game.ball);
    }, 20);
  }

  //#############################################################
  // ##########          AFTER GAME START           #############
  //#############################################################

  async movePad1(client: Socket, pad_info: any, nsp: Namespace) {
    const cur_game_id = await this.getCurGameRoomId(client);
    const cur_game: Game = this.gameSessions.get(cur_game_id);
    if (!cur_game) return;
    cur_game.pad[0].isEqual(pad_info);
    nsp.to(cur_game_id).emit('pad1', pad_info);
  }

  async movePad2(client: Socket, pad_info: any, nsp: Namespace) {
    const cur_game_id = await this.getCurGameRoomId(client);
    const cur_game: Game = this.gameSessions.get(cur_game_id);
    if (!cur_game) return;
    cur_game.pad[1].isEqual(pad_info);
    nsp.to(cur_game_id).emit('pad2', pad_info);
  }

  async destroyGame(client: Socket, nsp: Namespace) {
    //aboriting
    if (!client) return;

    //normal termiation
    const cur_game_id = await this.getCurGameRoomId(client);
    let cur_game: Game = this.gameSessions.get(cur_game_id);

    if (!cur_game) {
      return;
    }
    clearInterval(cur_game.intervalId);
    clearInterval(cur_game.count_intervalId);
    let loserPlayer: Player1 | Player2;
    let winnerPlayer: Player1 | Player2;
    //aborting game
    if (cur_game.gameStatus === GameStatus.Playing) {
      console.log('Playing');
      const outPlayer: Player1 | Player2 =
        cur_game.player1.socketID === client.id
          ? cur_game.player1
          : cur_game.player2;
      const remainPlayer: Player1 | Player2 =
        cur_game.player2.socketID === client.id
          ? cur_game.player1
          : cur_game.player2;
      loserPlayer = outPlayer;
      winnerPlayer = remainPlayer;
    } else if (cur_game.player1.score > cur_game.player2.score) {
      winnerPlayer = cur_game.player1;
      loserPlayer = cur_game.player2;
    } else {
      winnerPlayer = cur_game.player2;
      loserPlayer = cur_game.player1;
    }
    cur_game.gameWinner = winnerPlayer;
    cur_game.gameLoser = loserPlayer;

    //disJoin room
    const guest: Player2 = cur_game.guest;
    const host: Player1 = cur_game.host;
    const guestSocket: Socket = this.usersSockets.get(guest.socketID);
    const hostSocket: Socket = this.usersSockets.get(host.socketID);
    //const guestSocket : Socket = this.usersSockets.get(guest.socketID);
    //const hostSocket : Socket = this.usersSockets.get(host.socketID);
    await this.updateUserStatusOnline(guestSocket);
    await this.updateUserStatusOnline(hostSocket);

    //disjoin guest socket
    //this.logger.log("destoyed game : " + JSON.stringify(this.gameSessions.get(cur_game_id)));
    console.log('----------------------------------------–');
    if (cur_game.gameStatus !== GameStatus.Waiting) {
      console.log('----------------------------------------–');
      await this.recordGame(cur_game);
      console.log('=================win1========================');
      console.log('1');
      nsp.to(loserPlayer.socketID).emit('Win', winnerPlayer);
      console.log('2');
      nsp.to(winnerPlayer.socketID).emit('Win', winnerPlayer);
    } else {
      if (client.id === guest.socketID) nsp.to(host.socketID).emit('leave', '');
      else client.id === host.socketID;
      nsp.to(guest.socketID).emit('leave', '');
    }
    console.log('----------------------------------------------------');
    this.gameSessions.delete(cur_game.gameID);
    guestSocket.leave(cur_game_id);

    //destory gameSession
  }

  async destroySession(client: Socket, nsp: Namespace) {
    //if in queue, pop out queue
    await this.popQueue(client);

    //if in game, destroy game
    // await this.destroyGame(client, nsp);
  }

  async findGameRoomIdBySocketId(client: Socket) {
    const socketId = client.id;
    return this.gameSessions.get(socketId);
  }

  async destroyRoom(roomId: string, client: Socket, nsp: Namespace) {
    const cur_game = this.gameSessions.get(roomId);
    if (!cur_game) {
      return;
    }
    clearInterval(cur_game.intervalId);
    clearInterval(cur_game.count_intervalId);
    let loserPlayer: Player1 | Player2;
    let winnerPlayer: Player1 | Player2;
    //aborting game
    if (cur_game.gameStatus === GameStatus.Playing) {
      const outPlayer: Player1 | Player2 =
        cur_game.player1.socketID === client.id
          ? cur_game.player1
          : cur_game.player2;
      const remainPlayer: Player1 | Player2 =
        cur_game.player2.socketID === client.id
          ? cur_game.player1
          : cur_game.player2;
      loserPlayer = outPlayer;
      winnerPlayer = remainPlayer;
    } else if (cur_game.player1.score > cur_game.player2.score) {
      winnerPlayer = cur_game.player1;
      loserPlayer = cur_game.player2;
    } else {
      winnerPlayer = cur_game.player2;
      loserPlayer = cur_game.player1;
    }
    cur_game.gameWinner = winnerPlayer;
    cur_game.gameLoser = loserPlayer;

    //disJoin room
    const guest: Player2 = cur_game.guest;
    const host: Player1 = cur_game.host;
    const guestSocket: Socket = this.usersSockets.get(guest.socketID);
    const hostSocket: Socket = this.usersSockets.get(host.socketID);

    if (guestSocket) await this.updateUserStatusOnline(guestSocket);
    if (hostSocket) await this.updateUserStatusOnline(hostSocket);

    //disjoin guest socket
    //this.logger.log("destoyed game : " + JSON.stringify(this.gameSessions.get(cur_game_id)));
    if (cur_game.gameStatus !== GameStatus.Waiting) {
      console.log(
        '=================win========================',
        client.id,
        roomId,
      );
      nsp.to(winnerPlayer.socketID).emit('Win', winnerPlayer);
      await this.recordGame(cur_game);
    } else {
      if (client.id === guest.socketID) nsp.to(host.socketID).emit('leave', '');
      else client.id === host.socketID;
      nsp.to(guest.socketID).emit('leave', '');
    }
    console.log('=================2222========================');
    this.gameSessions.delete(cur_game.gameID);
    guestSocket.leave(cur_game.gameID);
    //destory gameSession
  }

  //#############################################################
  //##########          MAKING GAME RECORD           ############
  //#############################################################
  createGame(): Promise<Games> {
    const newGame = this.gamesRepository.create();
    return this.gamesRepository.save(newGame);
  }

  createGamePlayer(gamePlayer: CreateGamePlayerDto): Promise<GamePlayer> {
    const newGamePlayer = this.gamePlayerRepository.create(gamePlayer);
    return this.gamePlayerRepository.save(newGamePlayer);
  }

  async recordGame(gameSession: Game) {
    this.logger.log('----------------111-------------');
    const cur_game: Game = gameSession;
    const loserPlayer = cur_game.gameLoser;
    const winnerPlayer = cur_game.gameWinner;

    this.createGame().then(async (game) => {
      const player1Dto: CreateGamePlayerDto = {
        user: await this.userRepository.findOneBy({
          id: gameSession.player1.userID,
        }),
        game: game,
        score: gameSession.player1.score,
        winner: gameSession.player1.score > gameSession.player2.score,
      };

      const player2Dto: CreateGamePlayerDto = {
        user: await this.userRepository.findOneBy({
          id: gameSession.player2.userID,
        }),
        game: game,
        score: gameSession.player2.score,
        winner: gameSession.player2.score > gameSession.player1.score,
      };

      await this.createGamePlayer(player1Dto);
      await this.createGamePlayer(player2Dto);
    });

    //update user DB
    await this.loserUpdate(loserPlayer);
    await this.winnerUpdate(winnerPlayer);
    this.logger.log('----------------22222-------------');
  }

  async winnerUpdate(winner: Player1 | Player2) {
    const winner_user: User = await this.usersService.findUserById(
      winner.userID,
    );
    const wins_update: number = winner_user.wins + 1;
    const xp_update: number = winner_user.xp + 5;
    await this.usersService.update(winner_user.id, {
      wins: wins_update,
      xp: xp_update,
    });
  }

  async loserUpdate(loser: Player1 | Player2) {
    const loser_user: User = await this.usersService.findUserById(loser.userID);
    const loses_update: number = loser_user.loses + 1;
    await this.usersService.update(loser_user.id, { loses: loses_update });
  }
}
