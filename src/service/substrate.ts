import { ApiPromise, WsProvider } from '@polkadot/api';
import { stringToHex } from '@polkadot/util';
import { TypeRegistry } from '@polkadot/types';
import { SubstrateConfig } from '../types/config';

export class SubstrateService {
  private api: ApiPromise | null = null;
  private config: SubstrateConfig;
  private registry: TypeRegistry;

  constructor(config: SubstrateConfig) {
    this.config = config;
    this.registry = new TypeRegistry();
  }

  async connect(): Promise<void> {
    if (this.api) return;

    const provider = new WsProvider(this.config.node_url);
    this.api = await ApiPromise.create({ provider: provider as any });
    console.log(`Connected to Substrate node at ${this.config.node_url}`);
  }

  async disconnect(): Promise<void> {
    if (this.api) {
      await this.api.disconnect();
      this.api = null;
    }
  }

  async insertPrices(prices: Record<string, number>): Promise<void> {
    if (!this.api) {
      await this.connect();
    }

    const timestampMs = Date.now();

    for (const [feed, price] of Object.entries(prices)) {

      const encodedData = this.registry.createType('(f64, u64)', [price, timestampMs]).toHex();

      const key = stringToHex(feed);

      try {
        await (this.api!.rpc as any).offchain.localStorageSet('PERSISTENT', key, encodedData);
        console.log(`Inserted price ${price} for ${feed} into offchain storage`);
      } catch (error) {
        console.error(`Failed to insert price for ${feed}:`, error);
      }
    }
  }
}
