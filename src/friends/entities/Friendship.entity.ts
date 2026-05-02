import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from "typeorm";
import User from "../../users/entities/User.entity";

@Entity('friendships')
export default class Friendship {
  @PrimaryColumn('uuid')
  user1Id: string;

  @PrimaryColumn('uuid')
  user2Id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user1Id' })
  user1: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user2Id' })
  user2: User;
}
