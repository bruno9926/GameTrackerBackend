import GameTitle from '../entities/GameTitle.entity';
import { PublicUserData } from 'src/users/interfaces/public-user-data';

export default class GameDetailsDto {
  gameTitle: GameTitle;
  friendsPlaying: PublicUserData[];
}
