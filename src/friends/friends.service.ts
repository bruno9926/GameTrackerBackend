import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import Friendship from './entities/Friendship.entity';
import User from 'src/users/entities/User.entity';

@Injectable()
export class FriendsService {
    constructor(
        @InjectRepository(Friendship)
        private readonly friendshipRepository: Repository<Friendship>,
        private readonly dataSource: DataSource
    ) { }

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
