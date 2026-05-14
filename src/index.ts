import { TwitterClient } from "./twitter";
import { EscrowListener } from "./soroban";
import { formatAmount } from "./utils";
import { formatMessage } from "./messages";
import { CONFIG } from "./config";
import { EventQueue } from "./queue";
import { TweetPoster } from "./poster";

/**
 * Initializes the escrow event listener and Twitter client, then enters a polling loop
 * to check for new events. Detected events are pushed onto a queue and drained by a
 * separate poster that enforces a minimum interval between tweets.
 */
async function main() {
  console.log("Starting Twitter Bot...");
  console.log(`Listening to contract: ${CONFIG.SOROBAN_ESCROW_CONTRACT_ID}`);
  console.log(`Soroban RPC URL: ${CONFIG.SOROBAN_RPC_URL}`);

  const twitter = new TwitterClient();
  const escrow = new EscrowListener();
  const queue = new EventQueue<string>();
  const poster = new TweetPoster(queue, twitter);
  poster.start();

  console.log(`Polling every ${CONFIG.POLLING_INTERVAL}ms...`);
  console.log(
    `Minimum interval between tweets: ${CONFIG.POSTER_MIN_INTERVAL}ms`,
  );

  const poll = async () => {
    try {
      const events = await escrow.checkEvents();

      if (events.length > 0) {
        console.log(`Processing ${events.length} event(s)`);
        for (const event of events) {
          // Capture contract balance at detection time so the tweet reflects
          // the on-chain state right after the event, not minutes later when
          // the poster eventually drains the queue.
          const rawAmount = await escrow.getTokenBalance(
            CONFIG.SOROBAN_ESCROW_CONTRACT_ID,
          );
          const formattedAmount = formatAmount(rawAmount);

          const formattedMessage = formatMessage(event, formattedAmount);

          if (formattedMessage) {
            console.log(`Queueing tweet for ${event.type} event...`);
            poster.enqueue(formattedMessage);
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
}

main().catch(console.error);
