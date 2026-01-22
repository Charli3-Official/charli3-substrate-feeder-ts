import { BaseAdapter } from '../service/priceAdapter/BaseAdapter';
import { UniswapV3Adapter } from '../service/priceAdapter/evm/UniswapV3Adapter';
import { DexConfig, EVMChainConfig } from '../types/config';
import { AdapterConfig } from '../types';
import { getChainInfo } from '../utils/chainConstants';


export class AdapterFactory {
  private chainConfigs: Map<number, EVMChainConfig>;

  constructor(chainConfigs: EVMChainConfig[]) {
    this.chainConfigs = new Map();
    
    for (const config of chainConfigs) {
      this.chainConfigs.set(config.chain_id, config);
    }

    if (this.chainConfigs.size === 0) {
      throw new Error('At least one chain configuration is required in EVMChains');
    }
  }

  createAdapter(dexConfig: DexConfig): BaseAdapter {
    const chainId = dexConfig.chain_id;
    const chainConfig = this.chainConfigs.get(chainId);
    
    if (!chainConfig) {
      const availableChains = Array.from(this.chainConfigs.values())
        .map(c => `${c.name} (${c.chain_id})`)
        .join(', ');
      throw new Error(
        `Chain ${chainId} is not configured. Available chains: ${availableChains}`
      );
    }

    const adapterConfig: AdapterConfig = {
      rpcUrl: chainConfig.rpc_url,
      chainId: chainId,
      factoryAddress: chainConfig.factory_address,
      ...(chainConfig.max_concurrent !== undefined && { maxConcurrent: chainConfig.max_concurrent }),
    };

    const chainInfo = getChainInfo(chainId);
    console.log(`Creating adapter for ${chainInfo?.name || 'Unknown'} (chain ${chainId})`);

    switch (dexConfig.adapter.toLowerCase()) {
      case 'uniswapv3':
      case 'uniswap-v3':
      case 'pancakeswapv3':
      case 'pancakeswap-v3':
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






