import express, { Request, Response } from 'express';
import { AdapterFactory } from './adapterFactory';
import { PriceAggregator } from '../service/aggregator';
import { SubstrateService } from '../service/substrate';
import { processAndSubmit } from '../service/runner';
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

let config: any;
try {
    console.log(`Loading config from ${configPath}...`);
    config = loadConfig(path.resolve(process.cwd(), configPath));
} catch (e) {
    console.error(`Failed to load config file from ${configPath}:`, e);
    process.exit(1);
}

if (!config?.EVMChains || config.EVMChains.length === 0) {
    console.error('ERROR: EVMChains configuration is required. Please update your config file to the new format.');
    process.exit(1);
}

const PORT = parseInt(process.env.PORT || '3000');

const adapterFactory = new AdapterFactory(config.EVMChains);

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
    const supportedChains = config.EVMChains.map((c: any) => ({
        chainId: c.chain_id,
        name: c.name,
        rpcUrl: c.rpc_url,
    }));

    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        supportedChains,
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
                // For backward compatibility, default to Ethereum if chain_id not specified
                const chainId = (pair as any).chainId || 1;
                
                const adapter = adapterFactory.createAdapter({
                    adapter: 'uniswap-v3',
                    asset_a: pair.baseAsset,
                    asset_b: pair.quoteAsset,
                    sources: pair.sources || [],
                    chain_id: chainId,
                });

                const rates = await adapter.getRates();

                return {
                    pair: `${pair.baseAsset}-${pair.quoteAsset}`,
                    chainId,
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
    app.listen(PORT, async () => {
        console.log(`Price service listening on port ${PORT}`);
        console.log(`Configured chains:`);
        config.EVMChains.forEach((c: any) => {
            console.log(`  - ${c.name} (Chain ID: ${c.chain_id})`);
        });

        if (config && config.Substrate) {
            const substrateService = new SubstrateService(config.Substrate);
            await substrateService.connect();

            const intervalIndex = args.indexOf('--interval');
            const interval = intervalIndex !== -1 ? parseInt(args[intervalIndex + 1] || '60', 10) : 60;

            console.log(`Starting periodic runner with interval ${interval}s`);

            // Run in background
            (async () => {
                while (true) {
                    const startTime = Date.now();
                    try {
                        await processAndSubmit(config, adapterFactory, substrateService);
                    } catch (e) {
                        console.error('Error in periodic runner:', e);
                    }

                    const elapsed = (Date.now() - startTime) / 1000;
                    const waitTime = Math.max(0, interval - elapsed);
                    if (waitTime > 0) {
                        await new Promise(r => setTimeout(r, waitTime * 1000));
                    }
                }
            })();
        }
    });
}

// Start if called directly
if (require.main === module) {
    startServer();
}