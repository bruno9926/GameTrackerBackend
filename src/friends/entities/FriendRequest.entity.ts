import User from "../../users/entities/User.entity";
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Check,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export const FriendRequestStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
} as const;

type FriendRequestStatusType =
  typeof FriendRequestStatus[keyof typeof FriendRequestStatus];

@Entity("friend_requests")
@Check(`"senderId" != "receiverId"`)
export default class FriendRequest {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid")
  senderId: string;

  @Column("uuid")
  receiverId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "senderId" })
  sender: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: "receiverId" })
  receiver: User;

  @Column({
    type: "enum",
    enum: FriendRequestStatus,
    default: FriendRequestStatus.PENDING,
  })
  status: FriendRequestStatusType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}