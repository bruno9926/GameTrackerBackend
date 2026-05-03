import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities';
import { customAlphabet } from 'nanoid';

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const nanoid = customAlphabet(alphabet, 10);

@Injectable()
export class FriendCodeService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) {}

    generate(): string {
        return nanoid().match(/.{1,5}/g)!.join('-');
    }

    async getUserByFriendCode(friendCode: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { friendCode } });
    }
}
