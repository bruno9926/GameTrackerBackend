import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export default class QueueMovementDto {
  @IsString()
  @IsNotEmpty({ message: 'gameId must not be empty' })
  gameId: string;

  // null means "at the very start of the queue"
  @IsOptional()
  @IsString()
  beforeId?: string | null;

  // null means "at the very end of the queue"
  @IsOptional()
  @IsString()
  afterId?: string | null;
}
