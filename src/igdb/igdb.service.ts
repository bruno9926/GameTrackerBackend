import { Injectable, InternalServerErrorException } from "@nestjs/common";
import IgdbGameAdapter, { IGDBGame } from "./adapters/igdb.adapter";

type TwitchAuthResponse = {
  access_token: string;
  expires_in: number;
};

@Injectable()
export class IGDBService {

  private accessToken: string | null = null;
  private expiresAt: number | null = null;
  private API: string = process.env.IGDB_API;

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

  async search(searchString: string) {
    const accessToken = await this.getAccessToken();
    const client_id = process.env.TWITCH_CLIENT_ID;

    if (!accessToken) {
      throw new InternalServerErrorException("Could not be authenticated with IGDB");
    }

    try {
      const safeSearch = searchString.replace(/"/g, '');
      const response = await fetch(
        `${this.API}/games`,
        {
          method: "POST",
          body: `fields name,cover.image_id;search "${safeSearch}";`,
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Client-ID": client_id,
            "Content-Type": "text/plain"
          }
        }
      )

      if (!response.ok) {
        throw new InternalServerErrorException("IGDB request failed");
      }

      const data: IGDBGame[] = await response.json();
      return IgdbGameAdapter.toGameTitles(data);

    } catch (e: unknown) {
      throw new InternalServerErrorException((e as Error)?.message || JSON.stringify(e));
    }
  }
}