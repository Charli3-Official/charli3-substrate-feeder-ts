# Charli3 Substrate Feeder Service

Configurable feeder service with adapters for various EVM-based chains, fetching token prices from Uniswap V3 and compatible forks across multiple chains.

## Supported Chains

| Chain | Chain ID | DEX | Factory Address |
|-------|----------|-----|-----------------|
| **Ethereum** | 1 | Uniswap V3 | `0x1F98431c8aD98523631AE4a59f267346ea31F984` |
| **BSC** | 56 | PancakeSwap V3 | `0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865` |
| **Base** | 8453 | Uniswap V3 | `0x33128a8fC17869897dcE68Ed026d694621f6FDfD` |
| **Polygon** | 137 | Uniswap V3 | `0x1F98431c8aD98523631AE4a59f267346ea31F984` |
| **Arbitrum** | 42161 | Uniswap V3 | `0x1F98431c8aD98523631AE4a59f267346ea31F984` |
| **Optimism** | 10 | Uniswap V3 | `0x1F98431c8aD98523631AE4a59f267346ea31F984` |

### Fee Tiers

**Uniswap V3**: 100 (0.01%), 500 (0.05%), 3000 (0.3%), 10000 (1%)
**PancakeSwap V3**: 100 (0.01%), 500 (0.05%), 2500 (0.25%), 10000 (1%)

## Prerequisites

- Node.js v18+
- npm


## Installation

```bash
npm install
npm run build
```

## Configuration

Create a `config.yml` file based on the examples in the [examples/](examples/) folder.

- For single-chain adapter setup, use the chain-specific config (e.g., [ethereum.yml](examples/ethereum.yml)).
- For multi-chain setups, use [consolidated.yml](examples/consolidated.yml) as a starting point.

### Basic Structure

```yaml
EVMChains:
  - chain_id: 1
    name: ethereum
    rpc_url: https://eth.llamarpc.com
    factory_address: "0x1F98431c8aD98523631AE4a59f267346ea31F984"
    max_concurrent: 10  # Optional

Rates:
  ETH-USD:
    general_base_symbol: ETH-USD
    general_quote_symbol: null  # Optional
    base_currency:
      dexes:
        - adapter: uniswap-v3
          chain_id: 1
          asset_a: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"  # WETH
          asset_b: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"  # USDC
          quote_required: false  # Optional
          sources: [500, 3000]  # Fee tiers
```

### Configuration Fields

**EVMChains** (required):
- `chain_id`: EVM chain ID (1=Ethereum, 56=BSC, 8453=Base, etc.)
- `name`: Human-readable chain name
- `rpc_url`: RPC endpoint URL
- `factory_address`: Uniswap V3 factory address for this chain
- `max_concurrent`: (Optional) Max concurrent RPC requests

**Rates** (required):
- `general_base_symbol`: Symbol name for the rate
- `general_quote_symbol`: (Optional) Quote symbol for indirect pairs
- `base_currency.dexes[]`: Array of DEX configurations
  - `adapter`: Adapter type (`uniswap-v3` or `pancakeswap-v3`)
  - `chain_id`: Chain to query (must match EVMChains)
  - `asset_a`: Base token address
  - `asset_b`: Quote token address
  - `quote_required`: (Optional) If true, requires quote_currency
  - `quote_calc_method`: (Optional) `multiply` or `divide` for quote
  - `sources`: Fee tiers array, empty `[]` = all defaults
- `quote_currency.dexes[]`: (Optional) For indirect pairs like ETH-ADA

## Usage

### CLI Tool

Run the CLI to fetch prices for configured pairs directly in the terminal.

**Using default config (config.yml):**
```bash
npm run cli:config
```

**Using a specific config file:**
```bash
npm run cli:config -- path/to/config.yml
```

**Manual single pair lookup:**
```bash
npm run cli -- <base_asset_address> <quote_asset_address>
```

### HTTP Server

Start the REST API server to serve price data.

**Development mode:**
```bash
npm run dev:config -- config.yml
```

**Production mode:**
```bash
npm run start:config -- config.yml
```

The server listens on port 3000 by default.

## Docker Compose (3 nodes)

This repo includes a `docker-compose.yml` that spins up 3 feeder instances, each pointing at a different Substrate node port and fetching 14 pairs (5 Ethereum, 5 Base, 5 Polygon).

Setup:
1. Copy `.env.example` to `.env` and set your RPC URLs.
2. Update Substrate node ports in `docker-compose.yml` if needed.

Run:
```bash
docker compose up --build
```

Notes:
- Default interval is 300 seconds; override with `INTERVAL_SECONDS` in `.env`.
- RPC URLs are provided via env vars: `RPC_ETHEREUM`, `RPC_BASE`, `RPC_POLYGON`.

### API Endpoints

**GET /health** - Server status and configured chains

**POST /api/prices** - Fetch token prices

```json
{
  "pairs": [{
    "baseAsset": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "quoteAsset": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "chainId": 1,
    "sources": ["500"]
  }]
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/prices \
  -H "Content-Type: application/json" \
  -d '{
    "pairs": [{
      "baseAsset": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "quoteAsset": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "chainId": 1,
      "sources": ["500"]
    }]
  }'
```

## Development

```bash
npm run build    # Compile TypeScript
npm run dev      # Development mode with hot reload
npm test         # Run tests
```

## Adding New Chains

1. Add factory address to [src/utils/chainConstants.ts](src/utils/chainConstants.ts)
2. Add chain to `EVMChains` in your config
3. Use `chain_id` in your rate configurations

## Examples

### Multi-Chain Configuration

```yaml
EVMChains:
  - chain_id: 1
    name: ethereum
    rpc_url: https://eth.llamarpc.com
    factory_address: "0x1F98431c8aD98523631AE4a59f267346ea31F984"
  - chain_id: 56
    name: bsc
    rpc_url: https://bsc-dataseed.binance.org
    factory_address: "0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865"

Rates:
  ETH-USD:
    general_base_symbol: ETH-USD
    base_currency:
      dexes:
        - adapter: uniswap-v3
          chain_id: 1
          asset_a: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
          asset_b: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
          sources: [500, 3000]
  
  BNB-USD:
    general_base_symbol: BNB-USD
    base_currency:
      dexes:
        - adapter: uniswap-v3
          chain_id: 56
          asset_a: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
          asset_b: "0x55d398326f99059fF775485246999027B3197955"
          sources: [500, 2500]
```

### Indirect Pair with Quote Currency

For pairs like ETH-ADA where you need to calculate through an intermediate currency:

```yaml
Rates:
  ETH-ADA:
    general_base_symbol: ETH-ADA
    general_quote_symbol: ADA
    base_currency:
      dexes:
        - adapter: uniswap-v3
          chain_id: 1
          asset_a: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"  # WETH
          asset_b: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"  # USDC
          quote_required: true
          sources: []
    quote_currency:
      dexes:
        - adapter: uniswap-v3
          chain_id: 1
          asset_a: "0xADA_TOKEN_ADDRESS"
          asset_b: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"  # USDC
          quote_calc_method: divide
          sources: []
```

## License

See LICENSE file for details.
