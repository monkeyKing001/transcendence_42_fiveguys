import { Entity, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { GamePlayer } from './gamePlayer.entity';

@Entity()
export class Games {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  date: Date;

  @OneToMany(() => GamePlayer, (gamePlayer) => gamePlayer.game)
  gamePlayer: GamePlayer;
}
