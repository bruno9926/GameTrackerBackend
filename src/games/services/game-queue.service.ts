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

        let [left, center, right] = await this.findNeighbors(userId, beforeId, gameId, afterId);

        if (!this.isThereSpace(left?.order, right?.order)) {
            // if there is no espace, rebalance and query again
            await this.rebalanceQueue(userId);
            [left, center, right] = await this.findNeighbors(userId, beforeId, gameId, afterId);
        }

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

    private async findNeighbors(userId: string, leftId: string | null, centerId: string, rightId: string | null): Promise<[GameQueueEntry | null, GameQueueEntry | null, GameQueueEntry | null]> {
        const neighborIds = [leftId, centerId, rightId].filter((id): id is string => id != null);

        const entries = await this.gameQueueEntryRepository.find({
            where: {
                userId,
                gameId: In(neighborIds)
            }
        });

        let left: GameQueueEntry | null = null;
        let center: GameQueueEntry | null = null;
        let right: GameQueueEntry | null = null;

        entries.forEach(entry => {
            if (entry.gameId === leftId) {
                left = entry;
            } else if (entry.gameId === centerId) {
                center = entry;
            } else if (entry.gameId === rightId) {
                right = entry;
            }
        });

        return [left, center, right];
    }

    private isThereSpace(leftOrder: number | undefined, rightOrder: number | undefined) {
        // end case
        if (rightOrder === undefined) return true;
        // in betweeen or start case
        return (rightOrder - (leftOrder ?? 0)) > 1;
    }

    private async rebalanceQueue(userId: string) {
        const allEntries = await this.gameQueueEntryRepository.find({
            where: { userId }, order: { order: 'ASC' }
        });

        const balancedEntries = allEntries.map((entry, i) => ({
            id: entry.id,
            order: (i + 1) * ORDER_GAP
        })) as Partial<GameQueueEntry>[];

        await this.gameQueueEntryRepository.save(balancedEntries);
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