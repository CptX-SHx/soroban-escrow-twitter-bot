import { TwitterClient } from "./twitter";
import { EscrowListener } from "./soroban";
import { formatAmount } from "./utils";
import { formatMessage } from "./messages";
import { CONFIG } from "./config";
import { collectEcosystemReportData } from "./ecosystemReport";
import { formatEcosystemReportThread } from "./ecosystemMessages";

const twitter = new TwitterClient();

/**
 * Initializes the escrow event listener and Twitter client, then enters a polling loop
 * to check for new events and post formatted tweets.
 */
async function main() {
  console.log("Starting Twitter Bot...");
  console.log(`Listening to contract: ${CONFIG.SOROBAN_ESCROW_CONTRACT_ID}`);
  console.log(`Soroban RPC URL: ${CONFIG.SOROBAN_RPC_URL}`);

  const escrow = new EscrowListener();

  console.log(`Polling every ${CONFIG.POLLING_INTERVAL}ms...`);

  const poll = async () => {
    try {
      const events = await escrow.checkEvents();

      if (events.length > 0) {
        console.log(`Processing ${events.length} event(s)`);
        for (const event of events) {
          // Query token balance of the escrow contract for display
          const rawAmount = await escrow.getTokenBalance(
            CONFIG.SOROBAN_ESCROW_CONTRACT_ID,
          );
          const formattedAmount = formatAmount(rawAmount);

          const formattedMessage = formatMessage(event, formattedAmount);

          if (formattedMessage) {
            console.log(`Posting tweet for ${event.type} event...`);
            await twitter.postTweet(formattedMessage);
          }
        }
      }
    } catch (error) {
      console.error("Error in polling loop:", error);
    } finally {
      setTimeout(poll, CONFIG.POLLING_INTERVAL);
    }
  };

  // Start the polling loop
  poll();
  scheduleEcosystemReport();
}

main().catch(console.error);

// ─── Ecosystem Report Scheduler ───────────────────────────────────────────

let isPostingReport = false;

function nextReportTarget(): Date {
  const now = new Date();
  const target = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 28, 9, 0, 0, 0),
  );
  if (now.getTime() >= target.getTime()) {
    target.setUTCMonth(target.getUTCMonth() + 1);
  }
  return target;
}

async function postEcosystemReport(): Promise<void> {
  if (isPostingReport) {
    console.warn("Ecosystem report already in progress, skipping.");
    return;
  }
  isPostingReport = true;
  try {
    if (!CONFIG.COINMARKETCAP_API_KEY) {
      console.warn("Ecosystem report skipped: COINMARKETCAP_API_KEY not set");
      return;
    }
    console.log("Generating monthly ecosystem report...");
    const data = await collectEcosystemReportData();
    const tweets = formatEcosystemReportThread(data);
    if (CONFIG.DRY_RUN) {
      tweets.forEach((t, i) =>
        console.log(`[DRY RUN] Ecosystem report tweet ${i + 1}:\n${t}\n`),
      );
      return;
    }
    let lastTweetId: string | undefined;
    for (const tweet of tweets) {
      const result = await twitter
        .getClient()
        .v2.tweet(
          tweet,
          lastTweetId ? { reply: { in_reply_to_tweet_id: lastTweetId } } : {},
        );
      lastTweetId = result.data.id;
      await new Promise((r) => setTimeout(r, 3000));
    }
    console.log("Ecosystem report posted successfully.");
  } finally {
    isPostingReport = false;
  }
}

// Delays applied between retries after a failed ecosystem report attempt.
// First failure → retry in 1 hour; second failure → retry in 24 hours.
// Once these are exhausted the report is skipped until next month.
const ECOSYSTEM_RETRY_DELAYS_MS = [60 * 60 * 1000, 24 * 60 * 60 * 1000];

function scheduleEcosystemReport(): void {
  const target = nextReportTarget();
  const msUntil = target.getTime() - Date.now();
  const hours = Math.floor(msUntil / 3_600_000);
  console.log(
    `Next ecosystem report scheduled for ${target.toISOString()} (in ${hours}h)`,
  );
  const MAX_TIMEOUT = 2_147_483_647;
  if (msUntil > MAX_TIMEOUT) {
    setTimeout(() => scheduleEcosystemReport(), MAX_TIMEOUT);
    return;
  }
  setTimeout(() => attemptEcosystemReport(0), msUntil);
}

/**
 * Attempts to post the ecosystem report. On success, the next monthly report
 * is scheduled. On failure, the attempt is retried after a short delay
 * (see {@link ECOSYSTEM_RETRY_DELAYS_MS}) instead of waiting until next month;
 * once the retries are exhausted it falls back to the regular monthly schedule.
 */
async function attemptEcosystemReport(retryCount: number): Promise<void> {
  try {
    await postEcosystemReport();
    scheduleEcosystemReport();
  } catch (error) {
    console.error(
      "Ecosystem report failed:",
      error instanceof Error ? error.message : error,
    );
    if (retryCount < ECOSYSTEM_RETRY_DELAYS_MS.length) {
      const delay = ECOSYSTEM_RETRY_DELAYS_MS[retryCount];
      const hours = Math.round(delay / 3_600_000);
      console.log(
        `Retrying ecosystem report in ${hours}h (attempt ${retryCount + 2})...`,
      );
      setTimeout(() => attemptEcosystemReport(retryCount + 1), delay);
    } else {
      console.warn(
        "Ecosystem report retries exhausted; skipping until next month.",
      );
      scheduleEcosystemReport();
    }
  }
}
