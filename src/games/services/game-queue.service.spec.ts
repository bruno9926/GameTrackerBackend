import { Repository } from "typeorm";
import { GameQueueService } from "./game-queue.service"
import GameQueueEntry from "../entities/GameQueueEntry.entity";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

describe('GameQueueService', () => {
    let service: GameQueueService;
    let repositoryMock: Partial<jest.Mocked<Repository<GameQueueEntry>>>;

    beforeEach(async () => {
        repositoryMock = {
            find: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            create: jest.fn((data: Partial<GameQueueEntry>) => data) as any,
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameQueueService,
                { provide: getRepositoryToken(GameQueueEntry), useValue: repositoryMock }
            ]
        }).compile();

        service = module.get<GameQueueService>(GameQueueService);
    })

    describe('getGamesInQueue', () => {
        it('returns ordered game ids', async () => {
            repositoryMock.find.mockResolvedValue([
                { gameId: 'b', order: 2, userId: 'user-1' } as GameQueueEntry,
                { gameId: 'a', order: 1, userId: 'user-1' } as GameQueueEntry,
            ]);

            const entries = await service.getGamesInQueue('user-1');
            expect(entries).toEqual(['a', 'b']);
        });

        it('returns empty list when there are no queue entries', async () => {
            // given no entries created
            repositoryMock.find.mockResolvedValue([]);

            const entries = await service.getGamesInQueue('user-1');
            expect(entries.length).toBe(0);
        })
    })

    describe('moveGameInQueue', () => {
        it('adds a new game to an empty queue', async () => {
            repositoryMock.find.mockResolvedValue([]);

            await service.moveGameInQueue('user-1', { gameId: 'a', beforeId: null, afterId: null });

            expect(repositoryMock.save).toHaveBeenCalledWith(
                expect.objectContaining({ userId: 'user-1', gameId: 'a', order: 1000 })
            );
        });

        it('adds a new game at the end of the queue', async () => {
            repositoryMock.find.mockResolvedValue([
                { gameId: 'a', order: 1000, userId: 'user-1' } as GameQueueEntry,
            ]);

            await service.moveGameInQueue('user-1', { gameId: 'b', beforeId: 'a', afterId: null });

            expect(repositoryMock.save).toHaveBeenCalledWith(
                expect.objectContaining({ userId: 'user-1', gameId: 'b', order: 2000 })
            );
        });

        it('adds a new game at the start of the queue', async () => {
            repositoryMock.find.mockResolvedValue([
                { gameId: 'a', order: 1000, userId: 'user-1' } as GameQueueEntry,
            ]);

            await service.moveGameInQueue('user-1', { gameId: 'b', beforeId: null, afterId: 'a' });

            expect(repositoryMock.save).toHaveBeenCalledWith(
                expect.objectContaining({ userId: 'user-1', gameId: 'b', order: 500 })
            );
        });

        it('moves an already-queued game between two neighbors', async () => {
            repositoryMock.find.mockResolvedValue([
                { id: 'a-id', gameId: 'a', order: 1000, userId: 'user-1' } as GameQueueEntry,
                { id: 'b-id', gameId: 'b', order: 3000, userId: 'user-1' } as GameQueueEntry,
                { id: 'moved-id', gameId: 'moved', order: 5000, userId: 'user-1' } as GameQueueEntry,
            ]);

            await service.moveGameInQueue('user-1', { gameId: 'moved', beforeId: 'a', afterId: 'b' });

            expect(repositoryMock.update).toHaveBeenCalledWith('moved-id', { order: 2000 });
            expect(repositoryMock.save).not.toHaveBeenCalled();
        });

        it('rebalances the queue and retries when there is no room between neighbors', async () => {
            repositoryMock.find
                .mockResolvedValueOnce([
                    { id: 'a-id', gameId: 'a', order: 5, userId: 'user-1' } as GameQueueEntry,
                    { id: 'b-id', gameId: 'b', order: 6, userId: 'user-1' } as GameQueueEntry,
                ]) // initial neighbor lookup: no integer between 5 and 6
                .mockResolvedValueOnce([
                    { id: 'a-id', gameId: 'a', order: 5, userId: 'user-1' } as GameQueueEntry,
                    { id: 'b-id', gameId: 'b', order: 6, userId: 'user-1' } as GameQueueEntry,
                ]) // full queue fetched for the rebalance
                .mockResolvedValueOnce([
                    { id: 'a-id', gameId: 'a', order: 1000, userId: 'user-1' } as GameQueueEntry,
                    { id: 'b-id', gameId: 'b', order: 2000, userId: 'user-1' } as GameQueueEntry,
                ]); // neighbor lookup retried after rebalancing

            await service.moveGameInQueue('user-1', { gameId: 'new', beforeId: 'a', afterId: 'b' });

            expect(repositoryMock.save).toHaveBeenNthCalledWith(1, [
                { id: 'a-id', order: 1000 },
                { id: 'b-id', order: 2000 },
            ]);
            expect(repositoryMock.save).toHaveBeenNthCalledWith(2,
                expect.objectContaining({ userId: 'user-1', gameId: 'new', order: 1500 })
            );
        });
    })
})