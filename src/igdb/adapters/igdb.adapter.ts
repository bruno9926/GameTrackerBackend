import GameTitle, { GameSearchResult } from "src/games/entities/GameTitle.entity";

export type IGDBGame = {
    id: string,
    name: string,
    cover?: {
        image_id?: string | null
    },
    summary?: string,
    screenshots?: { image_id: string }[],
    first_release_date?: number,
    genres?: { name: string }[],
    platforms?: { name: string }[],
    involved_companies?: {
        company: { name: string },
        developer: boolean,
        publisher: boolean,
    }[],
}

type CoverSize = 'thumbnail' | 'large';

export default class IgdbGameAdapter {
    /** Maps a raw IGDB game into the lightweight shape used by search results. */
    static toGameSearchResult(igdbGame: IGDBGame): GameSearchResult {
        return {
            sourceId: String(igdbGame.id),
            source: 'igdb',
            name: igdbGame.name,
            cover: igdbGame.cover?.image_id
                ? IgdbGameAdapter.buildCoverUrl(igdbGame.cover.image_id)
                : null,
        };
    }

    /** Maps a list of raw IGDB games into lightweight search results. */
    static toGameSearchResults(igdbGames: IGDBGame[]): GameSearchResult[] {
        return igdbGames.map(IgdbGameAdapter.toGameSearchResult);
    }

    /** Maps a raw IGDB game into the full GameTitle entity */
    static toGameTitle(igdbGame: IGDBGame): GameTitle {
        return {
            sourceId: String(igdbGame.id),
            source: 'igdb',
            name: igdbGame.name,
            cover: igdbGame.cover?.image_id
                ? IgdbGameAdapter.buildCoverUrl(igdbGame.cover.image_id, 'large')
                : null,
            description: igdbGame.summary ?? '',
            screenshots: (igdbGame.screenshots ?? []).map(s => IgdbGameAdapter.buildImageUrl(s.image_id)),
            developer: igdbGame.involved_companies?.find(c => c.developer)?.company.name ?? '',
            publisher: igdbGame.involved_companies?.find(c => c.publisher)?.company.name ?? '',
            releaseDate: igdbGame.first_release_date
                ? new Date(igdbGame.first_release_date * 1000).toISOString()
                : '',
            genres: (igdbGame.genres ?? []).map(g => g.name),
            platforms: (igdbGame.platforms ?? []).map(p => p.name),
        };
    }

    private static buildCoverUrl(imageId: string, size: CoverSize = 'thumbnail') {
        const token = size === 'large' ? 't_1080p_2x' : 't_cover_big';
        return `https://images.igdb.com/igdb/image/upload/${token}/${imageId}.jpg`
    }

    /** Builds a full-size image URL (screenshots, artworks) from an IGDB image id. */
    static buildImageUrl(imageId: string): string {
        return `https://images.igdb.com/igdb/image/upload/t_1080p_2x/${imageId}.jpg`;
    }
}