import { CONFIG } from "./config";
import { EcosystemData } from "./ecosystemReport";
import { toBold } from "./utils";

/**
 * Builds the 3-tweet monthly ecosystem report thread:
 *   1/3 — Intro with month/year header
 *   2/3 — Market data and escrow snapshot
 *   3/3 — Trustlines and available chains
 */
export function formatEcosystemThread(
  data: EcosystemData,
): [string, string, string] {
  const monthYear = data.reportDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const tweet1 = `🧵 1/3 📊 ${toBold("SHx Ecosystem Report")} — ${monthYear}

Monthly snapshot of the Stronghold ($SHx) ecosystem.

Check the replies for the full report 👇`;

  const tweet2 = `🧵 2/3 💰 ${toBold("Market Data")}

💵 Price: $${data.price}
📈 Market Cap: $${data.marketCap}
🔄 Circulating Supply: ${data.circulatingSupply} SHx
(Source: CoinMarketCap, self-reported)

🔒 ${toBold("Escrow Contract")}

💎 Locked: ${data.escrowBalance} $SHX
📅 Active since: ${CONFIG.ESCROW_ACTIVE_SINCE}
🔗 ${CONFIG.ESCROW_LINK}`;

  const tweet3 = `🧵 3/3 👥 ${toBold("SHx Trustlines")}

✅ Funded: ${data.trustlinesFunded}
📋 Created: ${data.trustlinesCreated}

🌐 ${toBold("Available Chains")}

${CONFIG.AVAILABLE_CHAINS}

Follow @SHxEscrowAlerts for real-time escrow updates.
#SHx #SHxArmy #Stronghold #Stellar #DeFi`;

  return [tweet1, tweet2, tweet3];
}
