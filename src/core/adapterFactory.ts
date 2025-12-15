import { BaseAdapter } from '../service/priceAdapter/BaseAdapter';
import { UniswapV3Adapter } from '../service/priceAdapter/evm/UniswapV3Adapter';
import { DexConfig, EVMQueryConfig } from '../types/config';
import { AdapterConfig } from '../types';


export class AdapterFactory {
  private evmConfig: EVMQueryConfig;

  constructor(evmConfig: EVMQueryConfig) {
    this.evmConfig = evmConfig;
  }

  createAdapter(dexConfig: DexConfig): BaseAdapter {
    const adapterConfig: AdapterConfig = {
      rpcUrl: this.evmConfig.rpc_url,
      chainId: this.evmConfig.chain_id,
      ...(this.evmConfig.max_concurrent !== undefined && { maxConcurrent: this.evmConfig.max_concurrent }),
    };

    switch (dexConfig.adapter.toLowerCase()) {
      case 'uniswapv3':
      case 'uniswap-v3':
        return new UniswapV3Adapter(
          dexConfig.asset_a,
          dexConfig.asset_b,
          adapterConfig,
          this.parseFeeTiers(dexConfig.sources)
        );

      default:
        throw new Error(`Unsupported adapter type: ${dexConfig.adapter}`);
    }
  }


  private parseFeeTiers(sources: (string | number)[]): number[] | undefined {
    const feeTiers: number[] = [];
    
    for (const source of sources) {
      const sourceStr = source.toString();
      const feeMatch = sourceStr.match(/^(\d+)$/);
      if (feeMatch) {
        const fee = parseInt(feeMatch[1]!);
        if ([100, 500, 3000, 10000].includes(fee)) {
          feeTiers.push(fee);
        }
      }
    }

    return feeTiers.length > 0 ? feeTiers : undefined;
  }
}






