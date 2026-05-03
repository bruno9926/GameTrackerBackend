import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'gamesuser',
  password: process.env.DB_PASSWORD || 'gamespassword',
  database: process.env.DB_NAME || 'gamesdb',
  entities: ["src/**/*.entity{.ts,.js}"],
  migrations: ["src/migration/*.ts"],
  synchronize: false,
});