import { MigrationInterface, QueryRunner } from "typeorm";
import { customAlphabet } from 'nanoid';

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const nanoid = customAlphabet(alphabet, 10);

const generateFriendCode = () => nanoid().match(/.{1,5}/g)!.join('-');

export class BackfillFriendCodes1746000000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const users: { id: string }[] = await queryRunner.query(
            `SELECT id FROM "user" WHERE "friendCode" IS NULL`
        );

        for (const user of users) {
            let code: string;
            let exists = true;
            do {
                code = generateFriendCode();
                const result = await queryRunner.query(
                    `SELECT id FROM "user" WHERE "friendCode" = $1`, [code]
                );
                exists = result.length > 0;
            } while (exists);

            await queryRunner.query(
                `UPDATE "user" SET "friendCode" = $1 WHERE id = $2`, [code, user.id]
            );
        }
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {}
}
