import { EventQueue } from "./queue";
import { TwitterClient } from "./twitter";
import { CONFIG } from "./config";

/**
 * Drains queued tweet messages while enforcing a minimum interval between posts.
 *
 * Rule: every published tweet must be separated from the previous one by at
 * least `POSTER_MIN_INTERVAL` ms (default 5 min). If an event arrives after the
 * cooldown has already elapsed, it is posted immediately; otherwise it waits
 * until exactly `lastPostTimestamp + POSTER_MIN_INTERVAL`.
 */
export class TweetPoster {
  private readonly queue: EventQueue<string>;
  private readonly twitter: TwitterClient;
  private lastPostTimestamp = 0;
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(queue: EventQueue<string>, twitter: TwitterClient) {
    this.queue = queue;
    this.twitter = twitter;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.scheduleNext();
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Enqueue a tweet message and schedule a drain. The drain fires either
   * immediately (if the cooldown has lapsed) or at the next allowed slot.
   */
  enqueue(message: string): void {
    this.queue.enqueue(message);
    if (this.running) this.scheduleNext();
  }

  private scheduleNext(): void {
    if (!this.running || this.timer || this.queue.isEmpty()) return;

    const earliest = this.lastPostTimestamp + CONFIG.POSTER_MIN_INTERVAL;
    const delay = Math.max(0, earliest - Date.now());

    this.timer = setTimeout(() => {
      this.timer = null;
      void this.drainOne();
    }, delay);
  }

  private async drainOne(): Promise<void> {
    const message = this.queue.dequeue();
    if (!message) {
      this.scheduleNext();
      return;
    }

    try {
      await this.twitter.postTweet(message);
    } catch (error) {
      console.error("TweetPoster: error posting tweet:", error);
    }
    this.lastPostTimestamp = Date.now();
    this.scheduleNext();
  }
}
