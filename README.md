> [!IMPORTANT]  
> Work in progress. Bot functionalities are not yet complete and may change significantly.
> Refer to the following [fork](https://github.com/CptX-SHx/soroban-escrow-twitter-bot) for further developments.

> [!WARNING]
> This project and involved contributors are not affiliated with, endorsed by, or sponsored by Stronghold or any of its affiliates. This is an independent community project developed for educational and experimental purposes only. Use at your own risk.

# Soroban Escrow Twitter Bot

Twitter bot that monitors a specified Soroban escrow smart contract and automatically posts event notifications to Twitter.

## Overview

This bot listens for `lock` and `unlock` events emitted by the [Stronghold (SHx) escrow contract](https://stellar.expert/explorer/public/contract/CCA5HAZCPEYXD7JBKAJCVUZUXAK7V5ZFU3QMJO33OJH2OHL3OGLS2P7M), formats informative tweets, and posts them to a configured [Twitter account](https://x.com/SHxEscrowAlerts).

## Features

- Real-time monitoring of `lock` and `unlock` events via Soroban RPC.
- Cursor-based pagination for reliable event tracking.
- Formatted tweets with contract balance and transaction details.
- Configurable polling intervals and dry-run mode for testing.

Track ongoing tasks and project progress through the [GitHub Project](https://github.com/users/padparadscho/projects/4) board and participate in conversations or share your feedback in the dedicated [GitHub Discussions](https://github.com/padparadscho/soroban-escrow-twitter-bot/discussions) space.

## Prerequisites

- Node.js v18+
- Twitter Developer Account with Read/Write permissions
- Access to a Soroban RPC endpoint

## Installation

1. Clone the repository:

```bash
git clone https://github.com/padparadscho/soroban-escrow-twitter-bot.git
cd soroban-escrow-twitter-bot
```

2. Install dependencies:

```bash
pnpm install
```

3. Create and fill `.env` file based on `.env.example`.
   - For the `SOROBAN_ESCROW_CONTRACT_ID`, refer to the [soroban-escrow-contract](https://github.com/padparadscho/soroban-escrow-contract) repository **OR** download the [WASM code](https://stellar.expert/explorer/public/contract/CCA5HAZCPEYXD7JBKAJCVUZUXAK7V5ZFU3QMJO33OJH2OHL3OGLS2P7M?filter=interface) from the official Stronghold (SHx) escrow contract on mainnet.
   - For the `STELLAR_ASSET_CONTRACT_ID`, refer to the [stellar-asset-contract-deployer](https://github.com/padparadscho/stellar-asset-contract-deployer) repository **OR** use the [SHx SAC (Stellar Asset Contract)](https://stellar.expert/explorer/public/contract/CCKCKCPHYVXQD4NECBFJTFSCU2AMSJGCNG4O6K4JVRE2BLPR7WNDBQIQ) on mainnet.
   - For the `SOROBAN_RPC_URL` and `NETWORK_PASSPHRASE`, refer to the [Soroban RPC providers](https://developers.stellar.org/docs/data/apis/rpc/providers) documentation.
   - For the Twitter API credentials, refer to the [Twitter Developer Platform](https://docs.x.com/) documentation. Check the [.env.example](/.env.example) file for the required variables.
   - For the `STELLAR_EXPLORER_BASE_URL`, set it to the appropriate Stellar explorer URL based on the network you are using ([testnet](https://stellar.expert/explorer/testnet), [mainnet](https://stellar.expert/explorer/public), etc.).
   - Set the `POLLING_INTERVAL` as desired (default is 60000ms).
   - (Optional) Set `DRY_RUN=true` to test without posting to Twitter.

## Usage

1. Start the bot in development mode with auto-reloading:

```bash
pnpm run dev
```

2. Build and start the bot in production mode:

```bash
pnpm run build

pnpm start
```

3. (Optional) Using Docker:

```bash
# Build the Docker image
docker build -t soroban-escrow-twitter-bot .

# Run the Docker container
docker run -d --env-file .env --name soroban-escrow-twitter-bot-container soroban-escrow-twitter-bot

# Check logs
docker logs -f soroban-escrow-twitter-bot-container

# Stop and remove the container
docker stop soroban-escrow-twitter-bot-container && docker rm soroban-escrow-twitter-bot-container
```

## Contributing

If you're interested in helping improve the `soroban-escrow-twitter-bot` project, please see the [CONTRIBUTING](/CONTRIBUTING.md) file for guidelines on how to get started.

## License

This project is licensed under the [MIT License](/LICENSE).

## Acknowledgements

Special thanks to the following contributors and Stronghold (SHx) community members for their continuous help and support:

- <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/X_logo_2023_original.svg" width="10" /> [@DebunkJelpi](https://x.com/DebunkJelpi)
- <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/X_logo_2023_original.svg" width="10" /> [@DogeGecko](https://x.com/Dogegecko)
