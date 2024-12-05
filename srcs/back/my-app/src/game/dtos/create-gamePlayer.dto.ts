import { User } from 'src/typeorm';
import { Games } from 'src/typeorm';

export class CreateGamePlayerDto {
  readonly user: User;
  readonly game: Games;
  readonly score: number;
  readonly winner: boolean;
}
