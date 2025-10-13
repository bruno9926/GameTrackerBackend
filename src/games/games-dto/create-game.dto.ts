import Game from '../types/Game';
import { IsString, IsIn, IsNotEmpty } from 'class-validator';

export default class CreateGameDto extends Game {
  @IsString()
  @IsNotEmpty({ message: 'Name must not be empty' })
  name: string;

  @IsIn(['playing', 'completed', 'wishlist', 'paused'])
  status: 'playing' | 'completed' | 'wishlist' | 'paused';
}
