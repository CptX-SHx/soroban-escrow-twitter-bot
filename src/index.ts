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

  // Fetch balance once at startup; after this it is only ever updated
  // incrementally from event amounts, never re-queried live.
  let currentBalance = BigInt(
    await escrow.getTokenBalance(CONFIG.SOROBAN_ESCROW_CONTRACT_ID),
  );

  console.log(`Polling every ${CONFIG.POLLING_INTERVAL}ms...`);

  const poll = async () => {
    try {
      const events = await escrow.checkEvents();

      if (events.length > 0) {
        console.log(`Processing ${events.length} event(s)`);
        let isFirstInBatch = true;
        for (const event of events) {
          // Enforce a 5-minute gap between tweets within the same batch
          if (!isFirstInBatch) {
            await new Promise((r) => setTimeout(r, 5 * 60 * 1000));
          }
          isFirstInBatch = false;

          // Update balance incrementally instead of querying the chain again
          currentBalance =
            event.type === "lock"
              ? currentBalance + BigInt(event.amount)
              : currentBalance - BigInt(event.amount);

          const formattedAmount = formatAmount(currentBalance.toString());
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
  return new Date(Date.UTC(2026, 6, 7, 16, 15, 0, 0));
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
    for (let i = 0; i < tweets.length; i++) {
      try {
        const result = await twitter
          .getClient()
          .v2.tweet(
            tweets[i],
            lastTweetId
              ? { reply: { in_reply_to_tweet_id: lastTweetId } }
              : {},
          );
        lastTweetId = result.data.id;
        console.log(
          `Posted ecosystem report tweet ${i + 1}/${tweets.length} (id: ${lastTweetId})`,
        );
      } catch (error: any) {
        const detail = error?.data?.detail ?? error?.message ?? error;
        console.error(
          `Failed to post ecosystem report tweet ${i + 1}/${tweets.length}:`,
          detail,
        );
        console.warn(
          lastTweetId
            ? `No automatic retry. Last successful tweet id: ${lastTweetId}. Post the remaining ${tweets.length - i} tweet(s) manually as replies to it:`
            : `No automatic retry. No tweet posted yet. Post all ${tweets.length} tweet(s) manually:`,
        );
        tweets
          .slice(i)
          .forEach((t, idx) =>
            console.log(
              `--- Remaining tweet ${i + idx + 1}/${tweets.length} ---\n${t}\n`,
            ),
          );
        return;
      }

      if (i < tweets.length - 1) {
        await new Promise((r) => setTimeout(r, 30_000));
      }
    }
    console.log("Ecosystem report posted successfully.");
  } finally {
    isPostingReport = false;
  }
}

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
  setTimeout(async () => {
    try {
      await postEcosystemReport();
    } catch (error) {
      console.error(
        "Ecosystem report failed:",
        error instanceof Error ? error.message : error,
      );
    }
    scheduleEcosystemReport();
  }, msUntil);
}
