import User from "../../users/entities/User.entity";
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, Unique, JoinColumn } from "typeorm";
import Game from "./Game.entity";

@Unique(["userId", "gameId"])
@Entity('game_queue_entries')
export default class GameQueueEntry {
    @PrimaryGeneratedColumn('uuid')
    id: string | number;

    @Column()
    order: number;

    @Column("uuid")
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId'})
    user: User;

    @Column("uuid")
    gameId: string;

    @ManyToOne(() => Game, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'gameId'})
    game: Game;
}