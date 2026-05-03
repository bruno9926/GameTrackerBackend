import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFriendRequestIndex1777777310909 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        CREATE UNIQUE INDEX unique_pending_request_pair
        ON friend_requests (
            LEAST("senderId", "receiverId"),
            GREATEST("senderId", "receiverId")
        )
        WHERE status = 'pending';
        `);
    }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX unique_pending_request_pair;
    `);
  }
}
