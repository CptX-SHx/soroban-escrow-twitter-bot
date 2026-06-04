import { EscrowReportData } from "./ecosystemReport";
import { toBold } from "./utils";

export function formatEcosystemReportThread(data: EscrowReportData): string[] {
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "long" });
  const year = now.getFullYear();

  const mainTweet = `📊 ${toBold("SHx Ecosystem Report")} - ${month} ${year}

Monthly snapshot of the Stronghold $SHx ecosystem.

Check the replies for the full report 👇

🌐 stronghold.co | @strongholdpay

#SHx #SHxArmy #EDP #Stronghold #Stellar #DeFi`;

  const tweet1 = `🧵 1/2

📊 ${toBold("Market Data")}

💵 Price: $${data.shxPriceUsd}
📈 Market Cap: $${data.selfReportedMarketCap}
🔄 Circulating Supply: ${data.selfReportedCirculatingSupply} $SHx
(Source: CoinMarketCap, self-reported)

🔒 Locked in Escrow: ${data.escrowBalance} $SHx
📅 Escrow active since: ${data.escrowActiveDate}

📄 ${toBold("Escrow Contract")}
🔗 ${data.escrowLink}`;

  const tweet2 = `🧵 2/2

👥 ${toBold("SHx Trustlines")}

✅ Funded: ${data.fundedTrustlines}
📋 Total: ${data.totalTrustlines}
(Source: Stellar.Expert)

🌐 ${toBold("Available Chains")}

${data.availableChains.join(" · ")}


Follow @SHxEscrowAlerts for real-time escrow updates.

#StrongholdNet #Escrow #Stellar #Ethereum #XRPL`;

  return [mainTweet, tweet1, tweet2];
}
