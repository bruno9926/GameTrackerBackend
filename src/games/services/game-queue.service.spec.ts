import { Repository } from "typeorm";
import { GameQueueService } from "./game-queue.service"
import GameQueueEntry from "../entities/GameQueueEntry.entity";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

describe('GameQueueService', () => {
    let service: GameQueueService;
    let repositoryMock: Partial<jest.Mocked<Repository<GameQueueEntry>>>;

    beforeEach(async () => {
        repositoryMock = { find: jest.fn() };

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
})