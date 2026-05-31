import { TwitterClient } from "./twitter";
import { EscrowListener } from "./soroban";
import { formatAmount } from "./utils";
import { formatMessage } from "./messages";
import { CONFIG } from "./config";

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
}

main().catch(console.error);
