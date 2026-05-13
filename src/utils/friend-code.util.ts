import { customAlphabet } from 'nanoid';

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const nanoid = customAlphabet(alphabet, 10);

export function generateFriendCode(): string {
    return nanoid().match(/.{1,5}/g)!.join('-');
}
