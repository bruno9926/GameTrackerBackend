import Game from "src/games/entities/Game.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

export const UserStatus = {
    online: "online",
    offline: "offline",
    busy: "busy"
} as const

export type UserStatusType = typeof UserStatus[keyof typeof UserStatus];
@Entity()
export default class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ default: UserStatus.offline, type: 'enum', enum: UserStatus })
    status: UserStatusType;

    @Column()
    name: string;

    @Column({ unique: true })
    username: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    avatarUrl?: string | null;

    @Column({ select: false })
    password: string;

    @Column({ unique: true })
    friendCode: string;

    @OneToMany(() => Game, game => game.user)
    games: Game[];
}