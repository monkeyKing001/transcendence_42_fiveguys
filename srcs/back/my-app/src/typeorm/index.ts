import { User } from "./user.entity";
import { Games } from "./game.entity";
import {GamePlayer} from "./gamePlayer.entity";
//import { GameHistory } from "./gameHistory.entity";

const entities = [User, Games, GamePlayer];

export {User, Games, GamePlayer};
export default entities;
