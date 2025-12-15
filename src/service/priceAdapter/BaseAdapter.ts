import { AdapterConfig, PriceRequest, PriceResponse, Rate } from '../../types';

export abstract class BaseAdapter {
    constructor(
        protected baseAsset: string,
        protected quoteAsset: string,
        protected config: AdapterConfig
    ) { }


    abstract getRates(): Promise<Rate[]>;


    protected getTimestamp(): number {
        return Math.floor(Date.now() / 1000);
    }

    protected formatPrice(price: number, decimals: number = 6): number {
        return parseFloat(price.toFixed(decimals));
    }
}