export function formatEscrowInformationThread(): string[] {
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "long" });

  const tweet1 = `📋 Escrow Information (${month})

🧵 1/3

Stronghold locked 60 billion $SHx in a 5-year smart contract on Stellar.
Every month, 1B #SHx unlocks through escrow.
Unused tokens auto re-lock for another 5 years — a continuous, transparent, predictable release schedule.`;

  const tweet2 = `🧵 2/3

By enforcing token releases through a smart contract, SHx supply dynamics are governed by predefined rules, not manual decisions.
Unlocks are transparent, scheduled, and cannot be altered unexpectedly — building structural accountability into SHx tokenomics.`;

  const tweet3 = `🧵 3/3

Visit the following links for more information: 

📄 Escrow Contract (Stellar Expert)
https://stellar.expert/explorer/public/contract/CCA5HAZCPEYXD7JBKAJCVUZUXAK7V5ZFU3QMJO33OJH2OHL3OGLS2P7M

📝 Escrow Blog by Stronghold
https://stronghold.co/learn/stronghold-locks-60-billion-shx-escrow

▶️ Escrow - Strongholds YouTube
https://www.youtube.com/watch?v=8-iQ7AjcCv8`;

  return [tweet1, tweet2, tweet3];
}
