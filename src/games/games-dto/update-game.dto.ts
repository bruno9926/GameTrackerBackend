import CreateGameDto from './create-game.dto';
import { IsString, IsNotEmpty } from 'class-validator';

export default class UpdateGameDto extends CreateGameDto {
  @IsString()
  @IsNotEmpty({ message: 'ID must not be empty' })
  id: string;
}
