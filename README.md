# Charli3 Substrate Feeder

A TypeScript-based price feeder service for fetching and aggregating token prices from EVM-based DEXs (Uniswap V3). This service can be run as a standalone CLI tool or as an HTTP server.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```

## Configuration

The service uses a YAML configuration file to define EVM connection details and price pairs.

Copy `example-config.yml` to `config.yml` and adjust as needed:

```bash
cp example-config.yml config.yml
```


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

#### API Endpoints

- `GET /health`: Check server status and configuration.
- `POST /api/prices`: Fetch prices for specific pairs.
  - Body: `{ "pairs": [{ "baseAsset": "...", "quoteAsset": "..." }] }`

## Development

- `npm run dev`: Run server in development mode with hot reloading (requires `ts-node`).
- `npm run build`: Compile TypeScript to JavaScript in `dist/`.
- `npm test`: Run test suite.
