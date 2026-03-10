import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import User from "../../auth/entities/User.entity";

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

    @ManyToOne(() => User, user => user.id, { nullable: true})
    user?: User;
}