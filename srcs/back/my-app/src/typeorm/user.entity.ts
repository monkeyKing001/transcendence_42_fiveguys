import { Min } from 'class-validator';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  AfterInsert,
  AfterRemove,
  AfterUpdate,
  AfterLoad,
  ManyToOne,
  OneToMany,
} from 'typeorm';

export enum UserStatus {
  OFFLINE,
  ONLINE,
  GAME,
}

import { GamePlayer } from './gamePlayer.entity';
//import { GameHistory } from './gameHistory.entity';

//  User table
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  @Min(0)
  intraId: string;

  @Column({ nullable: true, unique: true })
  nickname: string;

  @Column({
    default: UserStatus.OFFLINE,
  })
  status: UserStatus;

  @ManyToMany(() => User)
  @JoinTable()
  friends: User[];

  @ManyToMany(() => User)
  @JoinTable()
  blocks: User[];

  @Column({ default: 0 })
  wins: number;

  @Column({ default: 0 })
  loses: number;

  @Column({ default: 0 })
  xp: number;

  @Column({ nullable: false, default: false })
  currentAvatarData: boolean;

  @Column({ nullable: false, default: false })
  twoFA: boolean;

  @Column({ default: false })
  avatarinit: boolean;

  @Column({ nullable: true })
  twoFASecret: string;

  @Column({ unique: true, nullable: true })
  socketId: string;

  @OneToMany(() => GamePlayer, (gamePlayer) => gamePlayer.user)
  gamePlayer: GamePlayer;

  //I want to add picture column for user
  @Column({ type: 'bytea', nullable: true })
  profilePicture: Buffer;

  @Column({ nullable: true })
  ft_pictureUrl: string;

//  @AfterInsert()
//  logInsert() {
//	console.log('Inserted User with id', this.id);
//  }
//
//  @AfterUpdate()
//  logUpdate() {
//    console.log('Updated User with id', this.id);
//  }
//
//  @AfterRemove()
//  logRemove() {
//    console.log('Removed User with id', this.id);
//  }
}
