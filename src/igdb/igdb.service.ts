import { Injectable, InternalServerErrorException } from "@nestjs/common";

type TwitchAuthResponse = {
  access_token: string;
  expires_in: number;
};

@Injectable()
export class IGDBService {

  private accessToken: string | null = null;
  private expiresAt: number | null = null;

  async getAccessToken() {
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
}



