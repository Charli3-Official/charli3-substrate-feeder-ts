import express, { Request, Response } from 'express';
import { AdapterFactory } from './adapterFactory';
import { PriceAggregator } from '../service/aggregator';
import { PriceRequest, PriceResponse } from '../types';
import { loadConfig } from '../utils/configLoader';
import * as path from 'path';

const app = express();
app.use(express.json());

const args = process.argv.slice(2);
const configIndex = args.indexOf('--config');
let configPath = process.env.CONFIG_PATH || 'config.yml';

if (configIndex !== -1) {
    configPath = args[configIndex + 1] || configPath;
}

let config;
try {
    console.log(`Loading config from ${configPath}...`);
    config = loadConfig(path.resolve(process.cwd(), configPath));
} catch (e) {
    console.warn(`Could not load config file from ${configPath}, using defaults/env vars`);
}

const PORT = parseInt(process.env.PORT || '3000');
const RPC_URL = config?.EVMQuery.rpc_url || process.env.RPC_URL || 'https://eth.llamarpc.com';
const CHAIN_ID = config?.EVMQuery.chain_id || parseInt(process.env.CHAIN_ID || '1');

const adapterFactory = new AdapterFactory({
    rpc_url: RPC_URL,
    chain_id: CHAIN_ID,
    ...(config?.EVMQuery.max_concurrent !== undefined && { max_concurrent: config.EVMQuery.max_concurrent })
});

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        rpcUrl: RPC_URL,
        chainId: CHAIN_ID,
    });
});

/**
 * Fetch prices endpoint
 */
app.post('/api/prices', async (req: Request, res: Response) => {
    try {
        const { pairs } = req.body as { pairs: PriceRequest[] };

        if (!pairs || !Array.isArray(pairs)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request: pairs array required',
            });
        }

        const results = await Promise.all(
            pairs.map(async (pair) => {
                const adapter = adapterFactory.createAdapter({
                    adapter: 'uniswap-v3',
                    asset_a: pair.baseAsset,
                    asset_b: pair.quoteAsset,
                    sources: pair.sources || []
                });

                const rates = await adapter.getRates();

                return {
                    pair: `${pair.baseAsset}-${pair.quoteAsset}`,
                    rates,
                };
            })
        );

        const response: PriceResponse = {
            success: true,
            data: results,
        };

        res.json(response);
    } catch (error: any) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * Start server
 */
export function startServer() {
    app.listen(PORT, () => {
        console.log(`Price service listening on port ${PORT}`);
        console.log(`RPC URL: ${RPC_URL}`);
        console.log(`Chain ID: ${CHAIN_ID}`);
    });
}

// Start if called directly
if (require.main === module) {
    startServer();
}