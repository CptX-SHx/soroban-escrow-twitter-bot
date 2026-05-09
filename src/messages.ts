import { EscrowEvent } from "./soroban";
import { formatAmount, formatDate, shortenAddress, toBold } from "./utils";
import { CONFIG } from "./config";

/**
 * Formats a tweet message for escrow events using Unicode styling and structured data.
 * Includes event details, contract balance updates and transaction link.
 * @param event - Parsed escrow event data
 * @param contractBalance - Formatted token balance of the escrow contract
 * @returns Formatted tweet string or empty if event type unrecognized
 */
export function formatMessage(
  event: EscrowEvent,
  contractBalance: string,
): string {
  const amount = formatAmount(event.amount);
  const date = formatDate(event.timestamp);
  const tx = `${CONFIG.STELLAR_EXPLORER_BASE_URL.replace(/\/$/, "")}/tx/${
    event.txHash
  }`;
  const id = event.txHash.slice(0, 8);
  const address = shortenAddress(event.account);

  if (event.type === "lock") {
    // Convert Unix timestamp to readable date for claim deadline
    const claimDate = event.claimAfter
      ? formatDate(parseInt(event.claimAfter) * 1000)
      : "Unknown";

    // Lock event message
    return `🚨 ${toBold("SHx Escrow Alert")} 🚨
    
🔒 Account ${toBold(address)} has locked ${toBold(
      amount,
    )} #SHx until ${claimDate}.
    
🔹 Escrow balance updated: ${toBold(contractBalance)} $SHx
    
🧾 ID: ${id}
🔗 ${tx}
🪙 Escrow Contract: https://stellar.expert/explorer/public/contract/CCA5HAZCPEYXD7JBKAJCVUZUXAK7V5ZFU3QMJO33OJH2OHL3OGLS2P7M`;
  } else if (event.type === "unlock") {
    // Unlock event message
    return `🚨 ${toBold("SHx Escrow Alert")} 🚨

🔓 Account ${toBold(address)} has unlocked ${toBold(amount)} #SHx on ${date}.
    
🔹 Escrow balance updated: ${toBold(contractBalance)} $SHx

🧾 ID: ${id}
🔗 ${tx}
🪙 Escrow Contract: https://stellar.expert/explorer/public/contract/CCA5HAZCPEYXD7JBKAJCVUZUXAK7V5ZFU3QMJO33OJH2OHL3OGLS2P7M`;
}
return "";
