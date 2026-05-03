import { Entity, PrimaryColumn, ManyToOne, JoinColumn, Check } from "typeorm";
import User from "../../users/entities/User.entity";

@Entity('friendships')
// this avoids the creation of duplicated friendship relations, it is redundant to have (id1,id2) and (id2,id1)
@Check(`"user1Id" < "user2Id"`)
@Check(`"user1Id" != "user2Id"`) 
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
