/**
 * Formats a raw amount (as string) into a human-readable representation with up to 7 decimal places.
 * @param amount - Raw amount as string (e.g., "1000000000")
 * @returns Formatted amount string (e.g., "100" or "100.5")
 */
export function formatAmount(amount: string): string {
  const rawAmount = BigInt(amount);
  const divisor = BigInt(10000000); // 10^7 for 7 decimal places

  const wholeUnits = rawAmount / divisor;
  const fractionalUnits = rawAmount % divisor;

  if (fractionalUnits === BigInt(0)) {
    return wholeUnits.toLocaleString();
  }

  let decimalString = fractionalUnits.toString().padStart(7, "0");
  decimalString = decimalString.replace(/0+$/, "");

  return `${wholeUnits.toLocaleString()}.${decimalString}`;
}

/**
 * Converts a Unix timestamp to a localized date+time string (UTC).
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date+time string (e.g., "December 4, 2025, 13:14 UTC")
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

/**
 * Transforms text into Unicode mathematical bold characters.
 * @param text - Input string to boldify
 * @returns Bold-transformed string
 */
export function toBold(text: string): string {
  return text
    .split("")
    .map((char) => {
      const n = char.charCodeAt(0);
      // Map to Mathematical Bold Capital Letters (U+1D400-U+1D419)
      if (n >= 65 && n <= 90) return String.fromCodePoint(0x1d400 + (n - 65));
      // Map to Mathematical Bold Small Letters (U+1D41A-U+1D433)
      if (n >= 97 && n <= 122) return String.fromCodePoint(0x1d41a + (n - 97));
      // Map to Mathematical Bold Digits (U+1D7CE-U+1D7D7)
      if (n >= 48 && n <= 57) return String.fromCodePoint(0x1d7ce + (n - 48));
      return char;
    })
    .join("");
}

// (Optional) Uncomment to enable italic text styling
// /**
//  * Transforms text into Unicode mathematical italic characters.
//  * @param text - Input string to italicize
//  * @returns Italic-transformed string
//  */
// export function toItalic(text: string): string {
//   return text
//     .split("")
//     .map((char) => {
//       const n = char.charCodeAt(0);
//       // Map to Mathematical Italic Capital Letters (U+1D434-U+1D44D)
//       if (n >= 65 && n <= 90) return String.fromCodePoint(0x1d434 + (n - 65));
//       // Map to Mathematical Italic Small Letters (U+1D44E-U+1D467)
//       if (n >= 97 && n <= 122) return String.fromCodePoint(0x1d44e + (n - 97));
//       // Digits do not have italic Unicode equivalents; return as is
//       return char;
//     })
//     .join("");
// }

/**
 * Shortens a Stellar address for display purposes.
 * @param address - Full Stellar address string
 * @returns Shortened address (e.g., "GABC...DEFG")
 */
export function shortenAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
