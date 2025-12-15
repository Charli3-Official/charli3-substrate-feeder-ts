import { BaseAdapter } from './priceAdapter/BaseAdapter';
import { Rate } from '../types';

export class PriceAggregator {
    private adapters: BaseAdapter[] = [];


    addAdapter(adapter: BaseAdapter): void {
        this.adapters.push(adapter);
    }


    async fetchRates(): Promise<Rate[]> {
        const results = await Promise.allSettled(
            this.adapters.map(adapter => adapter.getRates())
        );

        const rates: Rate[] = [];
        for (const result of results) {
            if (result.status === 'fulfilled') {
                rates.push(...result.value);
            }
        }

        return rates;
    }


    calculateMedian(rates: Rate[]): number | null {
        if (rates.length === 0) return null;

        const prices = rates.map(r => r.price).sort((a, b) => a - b);
        const mid = Math.floor(prices.length / 2);

        return prices.length % 2 === 0
            ? (prices[mid - 1]! + prices[mid]!) / 2
            : prices[mid]!;
    }

    filterOutliers(rates: Rate[]): Rate[] {
        if (rates.length < 4) return rates;

        const prices = rates.map(r => r.price).sort((a, b) => a - b);

        const q1Index = Math.floor(prices.length * 0.25);
        const q3Index = Math.floor(prices.length * 0.75);
        const q1 = prices[q1Index]!;
        const q3 = prices[q3Index]!;
        const iqr = q3 - q1;

        const lowerBound = q1 - 3 * iqr;
        const upperBound = q3 + 3 * iqr;

        return rates.filter(r => r.price >= lowerBound && r.price <= upperBound);
    }
}