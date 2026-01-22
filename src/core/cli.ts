import { UniswapV3Adapter } from '../service/priceAdapter/evm/UniswapV3Adapter';
import { PriceAggregator } from '../service/aggregator';
import { SubstrateService } from '../service/substrate';
import { loadConfig } from '../utils/configLoader';
import { AdapterFactory } from './adapterFactory';
import { processAndSubmit, displayRates } from '../service/runner';
import * as path from 'path';

async function main() {
  const args = process.argv.slice(2);

  const configIndex = args.indexOf('--config');

  if (configIndex !== -1) {
    const configPath = args[configIndex + 1] || 'config.yml';
    await runService(configPath);
    return;
  }

  const baseAsset = args[0] || '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'; // WBTC
  const quoteAsset = args[1] || '0xdAC17F958D2ee523a2206206994597C13D831ec7'; // USDT
  const rpcUrl = process.env.RPC_URL || 'https://eth.llamarpc.com';

  console.log('Fetching price for:', baseAsset, '/', quoteAsset);
  console.log('RPC:', rpcUrl);

  const adapter = new UniswapV3Adapter(
    baseAsset,
    quoteAsset,
    {
      rpcUrl,
      chainId: 1,
    }
  );

  const aggregator = new PriceAggregator();
  aggregator.addAdapter(adapter);

  const rates = await aggregator.fetchRates();
  displayRates(rates, aggregator);
}

async function runService(configPath: string) {
  console.log(`Loading config from ${configPath}...`);
  const config = loadConfig(path.resolve(process.cwd(), configPath));

  if (!config.EVMChains || config.EVMChains.length === 0) {
    throw new Error('EVMChains configuration is required. Please update your config file to the new format.');
  }

  const factory = new AdapterFactory(config.EVMChains);
  let substrateService: SubstrateService | null = null;

  if (config.Substrate) {
    substrateService = new SubstrateService(config.Substrate);
    await substrateService.connect();
  }

  try {
    await processAndSubmit(config, factory, substrateService);
  } finally {
    if (substrateService) {
      await substrateService.disconnect();
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { main };
