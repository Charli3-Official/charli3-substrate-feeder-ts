import { UniswapV3Adapter } from '../service/priceAdapter/evm/UniswapV3Adapter';
import { PriceAggregator } from '../service/aggregator';
import { loadConfig } from '../utils/configLoader';
import { AdapterFactory } from './adapterFactory';
import * as path from 'path';

async function main() {
  const args = process.argv.slice(2);
  
  const configIndex = args.indexOf('--config');
  if (configIndex !== -1) {
    const configPath = args[configIndex + 1] || 'config.yml';
    await runFromConfig(configPath);
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

async function runFromConfig(configPath: string) {
  console.log(`Loading config from ${configPath}...`);
  const config = loadConfig(path.resolve(process.cwd(), configPath));
  
  const factory = new AdapterFactory(config.EVMQuery);

  for (const [pairName, rateConfig] of Object.entries(config.Rates)) {
    console.log(`\nProcessing ${pairName}...`);
    const aggregator = new PriceAggregator();
    
    if (rateConfig.base_currency.dexes) {
      for (const dexConfig of rateConfig.base_currency.dexes) {
        try {
          const adapter = factory.createAdapter(dexConfig);
          aggregator.addAdapter(adapter);
        } catch (error) {
          console.error(`Failed to create adapter for ${pairName}:`, error);
        }
      }
    }

    const rates = await aggregator.fetchRates();
    displayRates(rates, aggregator);

  }
}

function displayRates(rates: any[], aggregator: PriceAggregator) {
  if (rates.length === 0) {
    console.log('No rates found');
    return;
  }

  console.log('Rates found:');
  rates.forEach(rate => {
    console.log(`  ${rate.source}: ${rate.price} (liquidity: ${rate.metadata.liquidity})`);
  });

  const median = aggregator.calculateMedian(rates);
  console.log(`Median price: ${median}`);
}

if (require.main === module) {
  main().catch(console.error);
}

export { main };






