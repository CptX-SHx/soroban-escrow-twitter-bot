import { TwitterClient } from "./twitter";
import { EscrowListener } from "./soroban";
import { formatAmount } from "./utils";
import { formatMessage } from "./messages";
import { fetchEcosystemData } from "./ecosystemReport";
import { formatEcosystemThread } from "./ecosystemMessages";
import { CONFIG } from "./config";

/**
 * Computes the delay in milliseconds until the next 28th of the month at
 * 09:00 UTC. If the current time is already past this month's 28th 09:00 UTC,
 * the next firing rolls over to the following month.
 */
function msUntilNext28th09UTC(now: Date = new Date()): number {
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 28, 9, 0, 0, 0),
  );
  if (next.getTime() <= now.getTime()) {
    next.setUTCMonth(next.getUTCMonth() + 1);
  }
  return next.getTime() - now.getTime();
}

/**
 * Schedules the monthly ecosystem report thread to fire on the 28th at
 * 09:00 UTC, then re-arms itself for the following month.
 */
function scheduleEcosystemReport(
  twitter: TwitterClient,
  escrow: EscrowListener,
): void {
  const fire = async () => {
    try {
      console.log("Generating monthly ecosystem report...");
      const data = await fetchEcosystemData(escrow);
      const thread = formatEcosystemThread(data);

      if (CONFIG.DRY_RUN) {
        console.log("[DRY RUN] Would have tweeted ecosystem thread:");
        thread.forEach((t, i) =>
          console.log(`--- Tweet ${i + 1}/3 ---\n${t}\n`),
        );
      } else {
        const client = twitter.getClient();
        await client.v2.tweetThread(thread);
        console.log("Ecosystem report thread sent successfully.");
      }
    } catch (error) {
      console.error("Error posting ecosystem report:", error);
    } finally {
      const delay = msUntilNext28th09UTC();
      console.log(
        `Next ecosystem report scheduled in ${Math.round(
          delay / 1000 / 60 / 60,
        )}h`,
      );
      setTimeout(fire, delay);
    }
  };

  const initialDelay = msUntilNext28th09UTC();
  console.log(
    `First ecosystem report scheduled in ${Math.round(
      initialDelay / 1000 / 60 / 60,
    )}h`,
  );
  setTimeout(fire, initialDelay);
}

/**
 * Initializes the escrow event listener and Twitter client, then enters a polling loop
 * to check for new events and post formatted tweets.
 */
async function main() {
  console.log("Starting Twitter Bot...");
  console.log(`Listening to contract: ${CONFIG.SOROBAN_ESCROW_CONTRACT_ID}`);
  console.log(`Soroban RPC URL: ${CONFIG.SOROBAN_RPC_URL}`);

  const twitter = new TwitterClient();
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

  // Schedule the monthly ecosystem report
  scheduleEcosystemReport(twitter, escrow);
}

main().catch(console.error);
