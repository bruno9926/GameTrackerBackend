import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export const GameStatus = {
  PLAYING: 'playing',
  COMPLETED: 'completed',
  WISHLIST: 'wishlist',
  PAUSED: 'paused',
} as const;

type GameStatusType = typeof GameStatus[keyof typeof GameStatus]

@Entity()
export default class Game {
    @PrimaryGeneratedColumn('uuid')
    id: string | number;

    @Column()
    name: string;

    @Column({ default: GameStatus.PLAYING, type: 'enum', enum: GameStatus })
    status : GameStatusType
}