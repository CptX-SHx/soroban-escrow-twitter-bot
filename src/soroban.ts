import {
  nativeToScVal,
  rpc,
  scValToNative,
  xdr,
  Account,
  Address,
  Contract,
  Keypair,
  TimeoutInfinite,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { CONFIG } from "./config";

export interface EscrowEvent {
  type: "lock" | "unlock";
  account: string;
  amount: string; // i128 to avoid overflow in JS numbers
  claimAfter?: string; // u64
  timestamp: number;
  txHash: string;
  ledger: number;
}

export class EscrowListener {
  private server: rpc.Server;
  private lastCursor: string | undefined;
  private startLedger: number | undefined;
  private readonly dummyKeypair: Keypair;

  constructor() {
    this.server = new rpc.Server(CONFIG.SOROBAN_RPC_URL);
    this.dummyKeypair = Keypair.random();
  }

  /**
   * Retrieves the sequence number of the latest ledger from the Soroban RPC server.
   * @returns Latest ledger sequence as a number
   */
  async getLatestLedger(): Promise<number> {
    const latestLedger = await this.server.getLatestLedger();
    return latestLedger.sequence;
  }

  /**
   * Polls for new contract events using cursor-based pagination to avoid duplicates.
   * Monitors the Escrow Contract for 'lock' and 'unlock' events.
   * @returns Array of parsed EscrowEvent objects
   */
  async checkEvents(): Promise<EscrowEvent[]> {
    try {
      // Initialize start ledger on first run
      if (!this.startLedger) {
        this.startLedger = await this.getLatestLedger();
        console.log(`Initializing listener at ledger ${this.startLedger}`);
      }

      // Build event request with contract filters
      const request: any = {
        filters: [
          {
            type: "contract",
            contractIds: [CONFIG.SOROBAN_ESCROW_CONTRACT_ID],
          },
        ],
        limit: 100,
      };

      // Use cursor for incremental polling, fallback to startLedger
      if (this.lastCursor) {
        request.cursor = this.lastCursor;
      } else {
        request.startLedger = this.startLedger;
      }

      const response = await this.server.getEvents(request);

      // Update startLedger from response for future requests
      if ((response as any).latestLedger) {
        this.startLedger = (response as any).latestLedger;
      }

      if (response.events && response.events.length > 0) {
        console.log(`Found ${response.events.length} events`);
        // Advance cursor to last event's paging token
        this.lastCursor = (
          response.events[response.events.length - 1] as any
        ).pagingToken;

        const parsedEvents: EscrowEvent[] = [];

        for (const event of response.events) {
          try {
            const parsed = this.parseEvent(event);
            if (parsed) {
              parsedEvents.push(parsed);
            }
          } catch (e) {
            console.error("Failed to parse individual event:", e);
          }
        }
        return parsedEvents;
      }

      return [];
    } catch (error) {
      console.error("Error fetching Soroban events:", error);
      return [];
    }
  }

  /**
   * Simulates a token balance query and retrieves the balance held by the escrow contract.
   * @param escrowContract - The escrow contract to check the balance for
   * @returns Balance as string (i128 representation)
   */
  async getTokenBalance(escrowContract: string): Promise<string> {
    if (!CONFIG.STELLAR_ASSET_CONTRACT_ID) {
      console.warn("STELLAR_ASSET_CONTRACT_ID not set, returning 0");
      return "0";
    }

    try {
      const sourceAccount = new Account(this.dummyKeypair.publicKey(), "0");

      // Call the SAC to check the balance of the escrow contract
      const assetContract = new Contract(CONFIG.STELLAR_ASSET_CONTRACT_ID);
      const op = assetContract.call(
        "balance",
        nativeToScVal(new Address(escrowContract)),
      );

      const tx = new TransactionBuilder(sourceAccount, {
        fee: "100",
        networkPassphrase: CONFIG.NETWORK_PASSPHRASE,
      })
        .addOperation(op)
        .setTimeout(TimeoutInfinite)
        .build();

      const response = await this.server.simulateTransaction(tx);

      if (
        rpc.Api.isSimulationSuccess(response) &&
        response.result &&
        response.result.retval
      ) {
        const result = scValToNative(response.result.retval);
        return result.toString();
      }
      return "0";
    } catch (error) {
      console.error("Error fetching token balance:", error);
      return "0";
    }
  }

  /**
   * Parses raw event data into structured EscrowEvent format.
   * Expects topics: ["escrow", type, account] where type is "lock" or "unlock".
   * @param event - Raw event response from RPC
   * @returns Parsed EscrowEvent or null if invalid
   */
  private parseEvent(event: rpc.Api.EventResponse): EscrowEvent | null {
    try {
      // Decode topics from XDR base64 to native values
      const topics = event.topic.map((t: any) => {
        if (typeof t === "string") {
          return scValToNative(xdr.ScVal.fromXDR(t, "base64"));
        }
        return scValToNative(t);
      });

      // Filter: only process "escrow" events (case-insensitive)
      const eventCategory = String(topics[0]).toLowerCase();
      if (eventCategory !== "escrow") {
        return null;
      }

      // Decode event value data from XDR
      let data: any;
      if (typeof event.value === "string") {
        data = scValToNative(xdr.ScVal.fromXDR(event.value, "base64"));
      } else {
        data = scValToNative(event.value as xdr.ScVal);
      }

      // topics: ["escrow", type, account]
      const eventType = (topics[1] as string).toLowerCase();
      const account = topics[2] as string;

      if (eventType === "lock") {
        return {
          type: "lock",
          account: account,
          amount: data.amount ? data.amount.toString() : "0",
          claimAfter: data.claim_after
            ? data.claim_after.toString()
            : undefined,
          timestamp: Date.now(),
          txHash: event.txHash,
          ledger: event.ledger,
        };
      } else if (eventType === "unlock") {
        return {
          type: "unlock",
          account: account,
          amount: data.amount ? data.amount.toString() : "0",
          timestamp: Date.now(),
          txHash: event.txHash,
          ledger: event.ledger,
        };
      }

      return null;
    } catch (e) {
      console.error("Error parsing event:", e);
      return null;
    }
  }
}
