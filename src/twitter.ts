import { TwitterApi } from "twitter-api-v2";
import { CONFIG } from "./config";

export class TwitterClient {
  private client: TwitterApi | undefined;

  constructor() {}

  private getClient(): TwitterApi {
    if (this.client) return this.client;

    this.client = new TwitterApi({
      appKey: CONFIG.TWITTER.APP_KEY,
      appSecret: CONFIG.TWITTER.APP_SECRET,
      accessToken: CONFIG.TWITTER.ACCESS_TOKEN,
      accessSecret: CONFIG.TWITTER.ACCESS_SECRET,
    });

    return this.client;
  }

  /**
   * Posts a tweet to Twitter using v2 API.
   * @param message - Tweet text content (max 280 characters)
   */
  async postTweet(message: string): Promise<void> {
    try {
      if (CONFIG.DRY_RUN) {
        console.log("[DRY RUN] Would have tweeted:", message);
        return;
      }

      const client = this.getClient();
      await client.v2.tweet(message);
      console.log("Tweet sent successfully.");
    } catch (error: any) {
      const code = error?.code ?? error?.status;
      const detail = error?.data?.detail ?? error?.message ?? error;
      console.error(
        `Error sending tweet${code ? ` (code ${code})` : ""}:`,
        detail,
      );
    }
  }
}
