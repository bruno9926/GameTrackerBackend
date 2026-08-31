type GameTitleSource = 'igdb' | 'manual';

export default class GameTitle {
  sourceId: string;
  source: GameTitleSource;
  name: string;
  cover: string | null;
  description: string;
  screenshots: string[];
  developer: string;
  publisher: string;
  releaseDate: string;
  genres: string[];
  platforms: string[]
}

export type GameSearchResult = Pick<GameTitle, "sourceId" | "source" | "name" | "cover">;
