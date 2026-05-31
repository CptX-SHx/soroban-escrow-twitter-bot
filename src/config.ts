import dotenv from "dotenv";

dotenv.config();

/**
 * Application configuration loaded from environment variables with fallback defaults.
 */
export const CONFIG = {
  SOROBAN_ESCROW_CONTRACT_ID: process.env.SOROBAN_ESCROW_CONTRACT_ID || "",
  STELLAR_ASSET_CONTRACT_ID: process.env.STELLAR_ASSET_CONTRACT_ID || "",
  SOROBAN_RPC_URL: process.env.SOROBAN_RPC_URL || "",
  NETWORK_PASSPHRASE: process.env.NETWORK_PASSPHRASE || "",
  STELLAR_EXPLORER_BASE_URL:
    process.env.STELLAR_EXPLORER_BASE_URL ||
    "https://stellar.expert/explorer/public",
  TWITTER: {
    APP_KEY: process.env.TWITTER_APP_KEY || "",
    APP_SECRET: process.env.TWITTER_APP_SECRET || "",
    ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN || "",
    ACCESS_SECRET: process.env.TWITTER_ACCESS_SECRET || "",
  },
  DRY_RUN: process.env.DRY_RUN === "true",
  POLLING_INTERVAL: parseInt(process.env.POLLING_INTERVAL || "60000", 10),
};

if (!CONFIG.SOROBAN_ESCROW_CONTRACT_ID) {
  console.warn("Warning: SOROBAN_ESCROW_CONTRACT_ID is not set in .env");
}
