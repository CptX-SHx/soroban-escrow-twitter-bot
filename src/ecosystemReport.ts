import { CONFIG } from "./config";
import { EscrowListener } from "./soroban";
import { formatAmount } from "./utils";

/**
 * SHx classic asset identifier on Mainnet, used by the Stellar.expert REST API.
 */
const SHX_ASSET_CODE = "SHX";
const SHX_ASSET_ISSUER =
  "GDSTRSHXHGJ7ZIVRBXEYE5Q74XUVCUSEKEBR7UCHEUUEK72N7I7KJ6JH";

export interface EcosystemData {
  price: string;
  marketCap: string;
  circulatingSupply: string;
  escrowBalance: string;
  trustlinesFunded: string;
  trustlinesCreated: string;
  reportDate: Date;
}

interface CmcQuote {
  price: number;
  marketCap: number;
  circulatingSupply: number;
}

/**
 * Fetches SHx market data from the CoinMarketCap quotes endpoint.
 * Prefers self-reported market cap and circulating supply when available.
 */
async function fetchCmcData(): Promise<CmcQuote> {
  if (!CONFIG.COINMARKETCAP_API_KEY) {
    throw new Error("COINMARKETCAP_API_KEY is not set");
  }

  const url =
    "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=SHX&convert=USD";

  const res = await fetch(url, {
    headers: {
      "X-CMC_PRO_API_KEY": CONFIG.COINMARKETCAP_API_KEY,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(
      `CoinMarketCap API error: ${res.status} ${res.statusText}`,
    );
  }

  const json: any = await res.json();
  const rawSymbol = json?.data?.SHX;
  const data = Array.isArray(rawSymbol) ? rawSymbol[0] : rawSymbol;

  if (!data) {
    throw new Error("CoinMarketCap response missing SHX data");
  }

  const quote = data.quote?.USD ?? {};

  return {
    price: Number(quote.price ?? 0),
    marketCap: Number(
      data.self_reported_market_cap ?? quote.market_cap ?? 0,
    ),
    circulatingSupply: Number(
      data.self_reported_circulating_supply ?? data.circulating_supply ?? 0,
    ),
  };
}

/**
 * Fetches SHx trustline counts from the Stellar.expert public asset endpoint.
 * Handles both array ([total, authorized, funded]) and object response shapes.
 */
async function fetchTrustlines(): Promise<{
  funded: number;
  created: number;
}> {
  const url = `https://api.stellar.expert/explorer/public/asset/${SHX_ASSET_CODE}-${SHX_ASSET_ISSUER}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(
      `Stellar.expert API error: ${res.status} ${res.statusText}`,
    );
  }

  const json: any = await res.json();
  const tl = json?.trustlines;

  if (Array.isArray(tl)) {
    return {
      created: Number(tl[0] ?? 0),
      funded: Number(tl[2] ?? tl[1] ?? 0),
    };
  }

  return {
    funded: Number(tl?.funded ?? 0),
    created: Number(tl?.total ?? tl?.created ?? 0),
  };
}

/**
 * Formats a USD price for SHx using up to 6 fractional digits while
 * collapsing trailing zeros for readability (e.g., "0.00123").
 */
function formatPrice(price: number): string {
  if (!Number.isFinite(price) || price === 0) return "0";
  return price.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

/**
 * Aggregates ecosystem metrics from CoinMarketCap, Stellar.expert and the
 * Soroban escrow contract into a single structured payload.
 */
export async function fetchEcosystemData(
  escrow: EscrowListener,
): Promise<EcosystemData> {
  const [cmc, trustlines, escrowBalance] = await Promise.all([
    fetchCmcData(),
    fetchTrustlines(),
    escrow.getTokenBalance(CONFIG.SOROBAN_ESCROW_CONTRACT_ID),
  ]);

  return {
    price: formatPrice(cmc.price),
    marketCap: Math.round(cmc.marketCap).toLocaleString("en-US"),
    circulatingSupply: Math.round(cmc.circulatingSupply).toLocaleString(
      "en-US",
    ),
    escrowBalance: formatAmount(escrowBalance),
    trustlinesFunded: trustlines.funded.toLocaleString("en-US"),
    trustlinesCreated: trustlines.created.toLocaleString("en-US"),
    reportDate: new Date(),
  };
}
