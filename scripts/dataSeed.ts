import { DataSource } from 'typeorm';
import Game from '../src/games/entities/Game.entity';
import { v4 as uuid } from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config();

const initialGames: Game[] = [
  { id: uuid(), name: 'Hollow Knight: Silksong', status: 'playing', gameTitleId: null },
  { id: uuid(), name: 'Final Fantasy 7 Rebirth', status: 'completed', gameTitleId: null },
  { id: uuid(), name: 'Yakuza 0', status: 'paused', gameTitleId: null },
  {
    id: uuid(),
    name: 'The Legend of Zelda: Echoes of Wisdom',
    status: 'paused',
    gameTitleId: null
  },
  {
    id: uuid(),
    name: 'Metal Gear Solid Delta: Snake Eater',
    status: 'playing',
    gameTitleId: null
  },
];

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'gamesuser',
  password: process.env.DB_PASSWORD || 'gamespassword',
  database: process.env.DB_NAME || 'gamesdb',
  entities: [Game],
  synchronize: false,
});

async function seed() {
  await dataSource.initialize();
  const gamesRepository = dataSource.getRepository(Game);

  const count = await gamesRepository.count();
  if (count > 0) {
    console.log('Database already seeded');
    await dataSource.destroy();
    return;
  }

  await gamesRepository.save(initialGames);
  console.log('Database seeded successfully');
  await dataSource.destroy();
}

seed().catch((error) => {
  console.log(error);
  dataSource.destroy();
});
