import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import Friendship from './entities/Friendship.entity';
import FriendRequest, { FriendRequestStatus } from './entities/FriendRequest.entity';
import User from 'src/users/entities/User.entity';
import { FriendCodeService } from 'src/users/friend-code.service';

@Injectable()
export class FriendsService {
    constructor(
        @InjectRepository(Friendship)
        private readonly friendshipRepository: Repository<Friendship>,
        @InjectRepository(FriendRequest)
        private readonly friendRequestRepository: Repository<FriendRequest>,
        private readonly dataSource: DataSource,
        private readonly friendCodeService: FriendCodeService
    ) { }

    async sendRequest(senderId: string, friendCode: string): Promise<void> {
        const receiver = await this.friendCodeService.getUserByFriendCode(friendCode);
        if (!receiver) throw new NotFoundException('User not found');

        const receiverId = receiver.id;

        if (senderId === receiverId)
            throw new BadRequestException('Cannot send a friend request to yourself');

        if (await this.areFriends(senderId, receiverId))
            throw new BadRequestException('Already friends');

        // check there are no friend requests in either direction
        const existing = await this.friendRequestRepository.findOne({
            where: [
                { senderId, receiverId, status: FriendRequestStatus.PENDING },
                { senderId: receiverId, receiverId: senderId, status: FriendRequestStatus.PENDING },
            ],
        });
        if (existing) throw new BadRequestException('Friend request already pending');

        await this.friendRequestRepository.save({ senderId, receiverId, status: FriendRequestStatus.PENDING });
    }

    async getRequests(userId: string): Promise<FriendRequest[]> {
        return this.friendRequestRepository.find({
            where: { receiverId: userId, status: FriendRequestStatus.PENDING },
            relations: ['sender'],
        });
    }

    async acceptRequest(requestId: string, userId: string): Promise<void> {
        const request = await this.friendRequestRepository.findOne({
            where: { id: requestId, receiverId: userId, status: FriendRequestStatus.PENDING },
        });

        if (!request) throw new NotFoundException('Friend request not found');

        if (await this.areFriends(request.senderId, userId))
            throw new BadRequestException('Already friends');

        // the user1Id should be lower than user2Id to avoid hitting the table check
        const [user1Id, user2Id] = [request.senderId, userId].sort();

        await this.dataSource.transaction(async manager => {
            await manager.save(Friendship, { user1Id, user2Id });
            await manager.update(FriendRequest, requestId, { status: FriendRequestStatus.ACCEPTED });
        });
    }

    async rejectRequest(requestId: string, userId: string): Promise<void> {
        const result = await this.friendRequestRepository.update(
            { id: requestId, receiverId: userId, status: FriendRequestStatus.PENDING },
            { status: FriendRequestStatus.REJECTED },
        );

        if (result.affected === 0) throw new NotFoundException('Friend request not found');
    }

    private async areFriends(userAId: string, userBId: string): Promise<boolean> {
        return this.friendshipRepository.exists({
            where: [
                { user1Id: userAId, user2Id: userBId },
                { user1Id: userBId, user2Id: userAId }
            ],
        });
    }

    async removeFriend(userId: string, friendId: string): Promise<void> {
        if (!await this.areFriends(userId, friendId)) {
            throw new NotFoundException('Friendship not found');    
        }
        const [user1Id, user2Id] = [userId, friendId].sort();
        const result = await this.friendshipRepository.delete({ user1Id, user2Id });
    }

    async getFriends(userId: string): Promise<User[]> {
        return this.dataSource
        .createQueryBuilder(User, 'u')
        .innerJoin(Friendship, 'f', `
            (f.user1Id = :userId AND f.user2Id = u.id)
            OR
            (f.user2Id = :userId AND f.user1Id = u.id)
        `)
        .setParameter('userId', userId)
        .getMany();
    }
}
