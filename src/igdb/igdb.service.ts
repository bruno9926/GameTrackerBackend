import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import IgdbGameAdapter, { IGDBGame } from "./adapters/igdb.adapter";
import GameTitle, { GameSearchResult } from "src/games/entities/GameTitle.entity";

type TwitchAuthResponse = {
  access_token: string;
  expires_in: number;
};

@Injectable()
export class IGDBService {

  private accessToken: string | null = null;
  private expiresAt: number | null = null;
  private API: string = process.env.IGDB_API;

  /** Returns a cached IGDB access token, refreshing it via Twitch OAuth once it's expired. */
  async getAccessToken(): Promise<string> {
    if (this.accessToken && !this.tokenHasExpired()) {
      return this.accessToken;
    }

    const data: TwitchAuthResponse = await this.authenticate();
    if (!data.access_token || !data.expires_in) {
      throw new InternalServerErrorException("Invalid IGDB auth response");
    }

    this.accessToken = data.access_token;
    this.expiresAt = Date.now() + data.expires_in * 1000;

    return this.accessToken;
  }

  private tokenHasExpired() {
    if (!this.expiresAt) return true;
    // mark as expired 5s before
    return Date.now() >= this.expiresAt - 5000;
  }

  /** Requests a fresh IGDB/Twitch OAuth access token. */
  async authenticate(): Promise<TwitchAuthResponse> {
    const client_id = process.env.TWITCH_CLIENT_ID;
    const client_secret = process.env.TWITCH_CLIENT_SECRET;
    const api = process.env.TWITCH_AUTH_API;

    const url = new URL(api);
    url.search = new URLSearchParams({
      client_id,
      client_secret,
      "grant_type": "client_credentials"
    }).toString();

    try {
      const response = await fetch(url, { method: "POST" });

      if (!response.ok) {
        throw new InternalServerErrorException("IGDB auth failed");
      }

      return response.json();
    } catch (e: unknown) {
      throw new InternalServerErrorException((e as Error)?.message || JSON.stringify(e));
    }
  }

  /** Searches IGDB for games matching a name, returning lightweight results for autocomplete-style lists. */
  async search(searchString: string): Promise<GameSearchResult[]> {
    const safeSearch = searchString.replace(/"/g, '');
    const data = await this.queryGames(`fields name,cover.image_id;search "${safeSearch}";`);
    return IgdbGameAdapter.toGameSearchResults(data);
  }

  /** Fetches the full details of a single game title by its IGDB id. */
  async getById(gameId: string): Promise<GameTitle> {
    const data = await this.queryGames(
      `fields name,cover.image_id,summary,screenshots.image_id,first_release_date,genres.name,platforms.name,involved_companies.company.name,involved_companies.developer,involved_companies.publisher;where id = ${gameId};`
    );

    if (!data.length) {
      throw new NotFoundException("Game title not found");
    }

    return IgdbGameAdapter.toGameTitle(data[0]);
  }

  private async queryGames(body: string): Promise<IGDBGame[]> {
    const accessToken = await this.getAccessToken();
    const client_id = process.env.TWITCH_CLIENT_ID;

    if (!accessToken) {
      throw new InternalServerErrorException("Could not be authenticated with IGDB");
    }

    try {
      const response = await fetch(`${this.API}/games`, {
        method: "POST",
        body,
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Client-ID": client_id,
          "Content-Type": "text/plain"
        }
      });

      if (!response.ok) {
        throw new InternalServerErrorException("IGDB request failed");
      }

      return response.json();
    } catch (e: unknown) {
      throw new InternalServerErrorException((e as Error)?.message || JSON.stringify(e));
    }
  }

  /** Returns a random artwork image URL for a game, or null if none exist. */
  async getArtworkUrl(gameId: string): Promise<string | null> {
    return this.fetchRandomImageUrl(
      `${this.API}/artworks`,
      `fields image_id; where game = ${gameId} & artwork_type != (5,6,7); limit 10;`
    );
  }

  /** Returns a random screenshot image URL for a game, or null if none exist. */
  async getScreenshotUrl(gameId: string): Promise<string | null> {
    return this.fetchRandomImageUrl(
      `${this.API}/screenshots`,
      `fields image_id; where game = ${gameId}; limit 10;`
    );
  }

  private async fetchRandomImageUrl(endpoint: string, query: string): Promise<string | null> {
    const accessToken = await this.getAccessToken();
    const client_id = process.env.TWITCH_CLIENT_ID;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: query,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Client-ID': client_id,
          'Content-Type': 'text/plain',
        },
      });

      if (!response.ok) throw new InternalServerErrorException('IGDB request failed');

      const data: { image_id: string }[] = await response.json();
      if (!data.length) return null;

      const pick = data[Math.floor(Math.random() * data.length)];
      return IgdbGameAdapter.buildImageUrl(pick.image_id);

    } catch (e: unknown) {
      throw new InternalServerErrorException((e as Error)?.message || JSON.stringify(e));
    }
  }
}