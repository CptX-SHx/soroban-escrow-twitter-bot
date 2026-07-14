import { toBold } from "./utils";

export function formatEscrowInformationThread(): string[] {
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "long" });

  const tweet1 = `📋 ${toBold("Escrow Information")} - ${month}

🧵 1/4

On June 16, 2025, Stronghold locked 60 billion $SHx in a 5-year smart contract on #Stellar.
This initiative is a foundational shift in how they manage token supply — a continuous, transparent, predictable schedule.`;

  const tweet2 = `🧵 2/4
 
How it works:
1B #SHx become claimable starting on the 15th of each month, then gets unlocked, used if needed, and the rest relocked — a cycle that repeats every month.
Funds stay secured by a multisig setup, requiring multiple approvals before any movement.`;

  const tweet3 = `🧵 3/4

By enforcing token releases through a smart contract, #SHx supply dynamics are governed by predefined rules, not manual decisions.
Unlocks are transparent, scheduled, and cannot be altered unexpectedly — building structural accountability into SHx tokenomics.`;

  const tweet4 = `🧵 4/4

Visit the following links for more information: 

📝 Escrow Blog by Stronghold
https://stronghold.co/learn/stronghold-locks-60-billion-shx-escrow

▶️ Escrow Insider - Stronghold YouTube
https://www.youtube.com/watch?v=8-iQ7AjcCv8

📄 Escrow Contract - Stellar Expert
https://stellar.expert/explorer/public/contract/CCA5HAZCPEYXD7JBKAJCVUZUXAK7V5ZFU3QMJO33OJH2OHL3OGLS2P7M

#SHxArmy #SHx #Stronghold #EDP #Stellar`;

  return [tweet1, tweet2, tweet3, tweet4];
}
