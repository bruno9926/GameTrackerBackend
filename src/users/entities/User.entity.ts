import Game from "src/games/entities/Game.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export default class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    username: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    avatarUrl?: string | null;

    @Column({ select: false, nullable: true })
    password?: string | null;

    @Column({ unique: true, nullable: true })
    googleId?: string | null;

    @Column({ unique: true })
    friendCode: string;

    @OneToMany(() => Game, game => game.user)
    games: Game[];
}