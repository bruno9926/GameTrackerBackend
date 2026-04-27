import GameTitle from "src/games/entities/GameTitle.entity";

export type IGDBGame = {
    id: string,
    name: string,
    cover?: {
        image_id?: string | null
    }
}

export default class IgdbGameAdapter {
    static toGameTitle(igdbGame: IGDBGame): GameTitle {
        console.log(igdbGame)
        return {
            sourceId: String(igdbGame.id),
            source: 'igdb',
            name: igdbGame.name,
            cover: igdbGame.cover?.image_id
                ? IgdbGameAdapter.buildCoverUrl(igdbGame.cover.image_id)
                : null,
        };
    }

    static toGameTitles(igdbGames: IGDBGame[]): GameTitle[] {
        return igdbGames.map(IgdbGameAdapter.toGameTitle);
    }

    private static buildCoverUrl(imageId: string) {
        return `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`
    }
}