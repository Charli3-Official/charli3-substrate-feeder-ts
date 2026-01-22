/**
 * Chain-specific constants for EVM networks
 */

export interface ChainInfo {
    chainId: number;
    name: string;
    factoryAddress: string;
    defaultRpcUrl: string;
}

/**
 * Uniswap V3 Factory addresses across different chains
 * Note: Many chains use Uniswap V3 forks with the same factory address
 */
export const FACTORY_ADDRESSES: Record<number, string> = {
    // Ethereum Mainnet - Uniswap V3
    1: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    
    // BSC (Binance Smart Chain) - PancakeSwap V3
    56: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
    
    // Base - Uniswap V3
    8453: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
    
    // Polygon - Uniswap V3
    137: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    
    // Arbitrum One - Uniswap V3
    42161: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    
    // Optimism - Uniswap V3
    10: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
};

/**
 * Chain information for supported networks
 */
export const CHAIN_INFO: Record<number, ChainInfo> = {
    1: {
        chainId: 1,
        name: 'Ethereum',
        factoryAddress: FACTORY_ADDRESSES[1]!,
        defaultRpcUrl: 'https://eth.llamarpc.com',
    },
    56: {
        chainId: 56,
        name: 'BSC',
        factoryAddress: FACTORY_ADDRESSES[56]!,
        defaultRpcUrl: 'https://bsc-dataseed.binance.org',
    },
    8453: {
        chainId: 8453,
        name: 'Base',
        factoryAddress: FACTORY_ADDRESSES[8453]!,
        defaultRpcUrl: 'https://mainnet.base.org',
    },
    137: {
        chainId: 137,
        name: 'Polygon',
        factoryAddress: FACTORY_ADDRESSES[137]!,
        defaultRpcUrl: 'https://polygon-rpc.com',
    },
    42161: {
        chainId: 42161,
        name: 'Arbitrum',
        factoryAddress: FACTORY_ADDRESSES[42161]!,
        defaultRpcUrl: 'https://arb1.arbitrum.io/rpc',
    },
    10: {
        chainId: 10,
        name: 'Optimism',
        factoryAddress: FACTORY_ADDRESSES[10]!,
        defaultRpcUrl: 'https://mainnet.optimism.io',
    },
};

/**
 * Get factory address for a given chain ID
 * Falls back to Ethereum factory address if chain not found
 */
export function getFactoryAddress(chainId: number): string {
    return FACTORY_ADDRESSES[chainId] || FACTORY_ADDRESSES[1]!;
}

/**
 * Get chain info for a given chain ID
 */
export function getChainInfo(chainId: number): ChainInfo | undefined {
    return CHAIN_INFO[chainId];
}

/**
 * Check if a chain is supported
 */
export function isChainSupported(chainId: number): boolean {
    return chainId in FACTORY_ADDRESSES;
}
