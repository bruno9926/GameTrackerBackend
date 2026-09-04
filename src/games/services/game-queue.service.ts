import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import GameQueueEntry from "../entities/GameQueueEntry.entity";
import { In, Repository } from "typeorm";
import { QueueMovementDto } from "../games-dto";

// spacing between orders on first insert / append-to-end, leaves room to insert between neighbors later
const ORDER_GAP = 1000;

@Injectable()
export class GameQueueService {
    constructor(
        @InjectRepository(GameQueueEntry)
        private readonly gameQueueEntryRepository: Repository<GameQueueEntry>
    ) { }

    /**
     * fetches a user's queue as an ordered list of game ids
     * @param userId the owner of the queue
     * @returns the queued game ids, in queue order
     */
    async getGamesInQueue(userId: string): Promise<string[]> {
        const entries = await this.gameQueueEntryRepository.find({
            where: { userId }
        });

        return entries
            .sort((g1, g2) => g1.order - g2.order)
            .map(entry => entry.gameId);
    }

    /**
     * places a game in a user's queue between two neighbors, adding it if it isn't queued yet or repositioning it otherwise
     * @param userId the owner of the queue
     * @param queueMovementDto the game to place, plus the ids of the games that should end up right before/after it (null at either end of the queue)
     */
    async moveGameInQueue(userId: string, queueMovementDto: QueueMovementDto): Promise<void> {
        const { beforeId, afterId, gameId } = queueMovementDto;
        const neighborIds = [beforeId, afterId, gameId].filter((id): id is string => id != null);

        const entries = await this.gameQueueEntryRepository.find({
            where: {
                userId,
                gameId: In(neighborIds)
            }
        });

        let left: GameQueueEntry | undefined;
        let center: GameQueueEntry | undefined;
        let right: GameQueueEntry | undefined;

        entries.forEach(entry => {
            if (entry.gameId === beforeId) {
                left = entry;
            } else if (entry.gameId === gameId) {
                center = entry;
            } else if (entry.gameId === afterId) {
                right = entry;
            }
        });

        const newOrder = this.calculateOrder(left?.order, right?.order);

        if (center) {
            // game is already in the queue, we updated
            await this.gameQueueEntryRepository.update(center.id, { order: newOrder });
        } else {
            // new add
            await this.gameQueueEntryRepository.save(
                this.gameQueueEntryRepository.create({ userId, gameId, order: newOrder })
            );
        }
    }

    /**
     * removes a game from a user's queue
     * @param userId the owner of the queue
     * @param gameId the game to remove
     */
    async removeFromQueue(userId: string, gameId: string) {
        await this.gameQueueEntryRepository.delete({ gameId: gameId, userId: userId })
    }

    private calculateOrder(leftOrder?: number, rightOrder?: number): number {
        // Neither present: first entry in the queue.
        if (leftOrder === undefined && rightOrder === undefined) return ORDER_GAP;
        // left missing: adding game at the start 
        if (leftOrder === undefined) return Math.round(rightOrder! / 2);
        // right missing: adding game at the end
        if (rightOrder === undefined) return leftOrder + ORDER_GAP;
        // both neighbors present: split the gap between them.
        return Math.round((leftOrder + rightOrder) / 2);
    }
}