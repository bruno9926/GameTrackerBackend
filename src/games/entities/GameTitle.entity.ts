type GameTitleSource = 'igdb' | 'manual';

export default class GameTitle {
  sourceId: string;
  source: GameTitleSource;
  name: string;
  cover: string | null
}
