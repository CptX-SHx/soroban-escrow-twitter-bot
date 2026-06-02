import { EscrowListener } from "./soroban";
import { CONFIG } from "./config";
import { formatAmount } from "./utils";

export interface EscrowReportData {
  shxPriceUsd: string;
  selfReportedMarketCap: string;
  selfReportedCirculatingSupply: string;
  escrowBalance: string;
  escrowActiveDate: string;
  escrowLink: string;
  fundedTrustlines: string;
  createdTrustlines: string;
  availableChains: string[];
}

function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(2) + "K";
  return num.toLocaleString("en-US");
}

async function fetchCoinMarketCapData(): Promise<{
  priceUsd: string;
  selfReportedMarketCap: string;
  selfReportedCirculatingSupply: string;
}> {
  if (!CONFIG.COINMARKETCAP_API_KEY) {
    throw new Error("COINMARKETCAP_API_KEY is not set");
  }
  const url =
    "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=SHX&convert=USD";
  const response = await fetch(url, {
    headers: {
      "X-CMC_PRO_API_KEY": CONFIG.COINMARKETCAP_API_KEY,
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(
      `CoinMarketCap API error: ${response.status} ${response.statusText}`,
    );
  }
  const json: any = await response.json();
  const raw = json?.data?.SHX;
  const data = Array.isArray(raw) ? raw[0] : raw;
  if (!data) throw new Error("SHX not found in CoinMarketCap response");
  const price: number = data.quote?.USD?.price ?? 0;
  const marketCap: number = data.self_reported_market_cap ?? 0;
  const supply: number = data.self_reported_circulating_supply ?? 0;
  return {
    priceUsd: price.toFixed(6),
    selfReportedMarketCap: formatLargeNumber(marketCap),
    selfReportedCirculatingSupply: formatLargeNumber(supply),
  };
}

async function fetchStellarExpertData(): Promise<{
  fundedTrustlines: string;
  createdTrustlines: string;
}> {
  const url =
    "https://api.stellar.expert/explorer/public/asset/SHX-GDSTRSHXHGJ7ZIVRBXEYE5Q74XUVCUSEKEBR7UCHEUUEK72N7I7KJ6JH";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Stellar.expert API error: ${response.status}`);
  }
  const json: any = await response.json();
  const trustlines = json?.trustlines;
  const funded: number = Array.isArray(trustlines)
    ? (trustlines[2] ?? 0)
    : (trustlines?.funded ?? 0);
  const created: number = Array.isArray(trustlines)
    ? (trustlines[0] ?? 0)
    : (trustlines?.total ?? 0);
  return {
    fundedTrustlines: funded.toLocaleString("en-US"),
    createdTrustlines: created.toLocaleString("en-US"),
  };
}

export async function collectEcosystemReportData(): Promise<EscrowReportData> {
  const escrow = new EscrowListener();
  const [cmcData, stellarData, rawBalance] = await Promise.all([
    fetchCoinMarketCapData(),
    fetchStellarExpertData(),
    escrow.getTokenBalance(CONFIG.SOROBAN_ESCROW_CONTRACT_ID),
  ]);
  return {
    shxPriceUsd: cmcData.priceUsd,
    selfReportedMarketCap: cmcData.selfReportedMarketCap,
    selfReportedCirculatingSupply: cmcData.selfReportedCirculatingSupply,
    escrowBalance: formatAmount(rawBalance ?? "0"),
    escrowActiveDate: CONFIG.ESCROW_ACTIVE_SINCE,
    escrowLink: CONFIG.ESCROW_LINK,
    fundedTrustlines: stellarData.fundedTrustlines,
    createdTrustlines: stellarData.createdTrustlines,
    availableChains: CONFIG.AVAILABLE_CHAINS,
  };
}
