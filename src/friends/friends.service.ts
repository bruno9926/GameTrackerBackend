import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import Friendship from './entities/Friendship.entity';
import FriendRequest, { FriendRequestStatus } from './entities/FriendRequest.entity';
import User from 'src/users/entities/User.entity';
import { UsersService } from 'src/users/users.service';
import { PublicUserData } from 'src/users/interfaces/public-user-data';
import Game from 'src/games/entities/Game.entity';
import { ConnectionRegistryService, PresenceStatus } from 'src/connection-registry/connection-registry.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import FriendRequestSentEvent from 'src/events/friend-request-sent.event';

// games are only fetched for a single friend lookup (getFriend), not for the list (getFriends)
export type FriendResponse = PublicUserData & { games?: Game[]; status: PresenceStatus };

@Injectable()
export class FriendsService {
    constructor(
        @InjectRepository(Friendship)
        private readonly friendshipRepository: Repository<Friendship>,
        @InjectRepository(FriendRequest)
        private readonly friendRequestRepository: Repository<FriendRequest>,
        private readonly dataSource: DataSource,
        private readonly usersService: UsersService,
        private readonly presenceService: ConnectionRegistryService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    /** Sends a friend request to the user with the given friend code. */
    async sendRequest(senderId: string, friendCode: string): Promise<void> {
        const receiver = await this.usersService.getUserByFriendCode(friendCode);
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

        const sender = await this.usersService.getUserById(senderId);
        this.eventEmitter.emit('friend.request.sent', new FriendRequestSentEvent(senderId, sender.name, sender.avatarUrl ?? null, receiverId));
    }

    /** Returns the pending friend requests sent to this user. */
    async getRequests(userId: string): Promise<FriendRequest[]> {
        return this.friendRequestRepository.find({
            where: { receiverId: userId, status: FriendRequestStatus.PENDING },
            relations: ['sender'],
        });
    }

    /** Accepts a pending friend request, creating the friendship. */
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

    /** Rejects a pending friend request. */
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

    /** Returns a single friend's public data, library, and presence status. */
    async getFriend(userId: string, friendId: string): Promise<FriendResponse> {
        if (!await this.areFriends(userId, friendId))
            throw new NotFoundException('Friendship not found');

        const friend = await this.dataSource
            .createQueryBuilder(User, 'u')
            .leftJoinAndSelect("u.games", "games")
            .where('u.id = :friendId', { friendId })
            .getOne();

        if (!friend) {
            throw new NotFoundException('Friend not found');
        }

        return {
            ...this.usersService.toPublicUserData(friend),
            games: friend.games,
            status: this.presenceService.getStatus(friendId)
        };
    }

    /** Removes an existing friendship between two users. */
    async removeFriend(userId: string, friendId: string): Promise<void> {
        if (!await this.areFriends(userId, friendId)) {
            throw new NotFoundException('Friendship not found');    
        }
        const [user1Id, user2Id] = [userId, friendId].sort();
        await this.friendshipRepository.delete({ user1Id, user2Id });
    }

    /** Returns this user's friends with their public data and presence status. */
    async getFriends(userId: string): Promise<FriendResponse[]> {
        const friends = await this.dataSource
            .createQueryBuilder(User, 'u')
            .innerJoin(Friendship, 'f', `
                (f.user1Id = :userId AND f.user2Id = u.id)
                OR
                (f.user2Id = :userId AND f.user1Id = u.id)
            `)
            .setParameter('userId', userId)
            .getMany();

        const statuses = this.presenceService.getStatuses(friends.map(f => f.id));
        return friends.map(friend => ({
            ...this.usersService.toPublicUserData(friend),
            status: statuses[friend.id]
        }));
    }

    /** Returns the friends of this user who have the given game title in their library. */
    async getFriendsPlayingGameTitle(userId: string, gameTitleId: string): Promise<PublicUserData[]> {
        const friends = await this.friendsPlayingGameTitleQuery(userId, gameTitleId).getMany();
        return friends.map(friend => this.usersService.toPublicUserData(friend));
    }

    /** Counts how many of this user's friends have the given game title in their library. */
    async countFriendsPlayingGameTitle(userId: string, gameTitleId: string): Promise<number> {
        return this.friendsPlayingGameTitleQuery(userId, gameTitleId).getCount();
    }

    private friendsPlayingGameTitleQuery(userId: string, gameTitleId: string) {
        return this.dataSource
            .createQueryBuilder(User, 'u')
            .innerJoin(Friendship, 'f', `
                (f.user1Id = :userId AND f.user2Id = u.id)
                OR
                (f.user2Id = :userId AND f.user1Id = u.id)
            `)
            .innerJoin('u.games', 'g', 'g.gameTitleId = :gameTitleId')
            .setParameter('userId', userId)
            .setParameter('gameTitleId', gameTitleId);
    }
}
