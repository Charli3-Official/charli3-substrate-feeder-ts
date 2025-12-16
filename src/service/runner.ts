import { AppConfig } from '../types/config';
import { AdapterFactory } from '../core/adapterFactory';
import { SubstrateService } from './substrate';
import { PriceAggregator } from './aggregator';

export async function processAndSubmit(
    config: AppConfig,
    factory: AdapterFactory,
    substrateService: SubstrateService | null
) {
    const pricesToSubmit: Record<string, number> = {};

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

        const median = aggregator.calculateMedian(rates);
        if (median !== null && median > 0) {
            pricesToSubmit[rateConfig.general_base_symbol] = median;
        }
    }

    if (substrateService && Object.keys(pricesToSubmit).length > 0) {
        console.log('\nSubmitting prices to Substrate...');
        await substrateService.insertPrices(pricesToSubmit);
    }
}

export function displayRates(rates: any[], aggregator: PriceAggregator) {
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
