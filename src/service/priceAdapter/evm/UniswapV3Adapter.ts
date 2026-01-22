import { ethers } from 'ethers';
import { Token, CurrencyAmount } from '@uniswap/sdk-core';
import { Pool, FeeAmount, computePoolAddress } from '@uniswap/v3-sdk';
import UniswapV3Pool from '@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json';
import IERC20Metadata from '@uniswap/v3-periphery/artifacts/contracts/interfaces/IERC20Metadata.sol/IERC20Metadata.json';
import { BaseAdapter } from '../BaseAdapter';
import { Rate, AdapterConfig } from '../../../types';
import { getFactoryAddress } from '../../../utils/chainConstants';

const POOL_ABI = UniswapV3Pool.abi;
const ERC20_ABI = IERC20Metadata.abi;
const FACTORY_ABI = ['function getPool(address tokenA, address tokenB, uint24 fee) view returns (address pool)'];

export class UniswapV3Adapter extends BaseAdapter {
    private provider: ethers.JsonRpcProvider;
    private feeTiers: FeeAmount[];
    private factoryAddress: string;
    private tokenCache = new Map<string, { decimals: number; symbol: string }>();

    constructor(
        baseAsset: string,
        quoteAsset: string,
        config: AdapterConfig,
        feeTiers?: FeeAmount[]
    ) {
        super(baseAsset, quoteAsset, config);
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
        this.factoryAddress = config.factoryAddress || getFactoryAddress(config.chainId);

        this.feeTiers = feeTiers || [
            FeeAmount.LOWEST,  // 100 (0.01%)
            FeeAmount.LOW,     // 500 (0.05%)
            FeeAmount.MEDIUM,  // 3000 (0.3%)
            FeeAmount.HIGH,    // 10000 (1%)
        ];
    }

    async getRates(): Promise<Rate[]> {
        const rates: Rate[] = [];

        const [baseToken, quoteToken] = await Promise.all([
            this.getTokenInfo(this.baseAsset),
            this.getTokenInfo(this.quoteAsset),
        ]);

        const results = await Promise.allSettled(
            this.feeTiers.map(fee => this.getPoolRate(baseToken, quoteToken, fee))
        );

        for (const result of results) {
            if (result.status === 'fulfilled' && result.value) {
                rates.push(result.value);
            }
        }

        return rates;
    }

    private async getPoolRate(
        baseToken: TokenInfo,
        quoteToken: TokenInfo,
        fee: FeeAmount
    ): Promise<Rate | null> {
        try {
            const token0 = new Token(
                this.config.chainId,
                baseToken.address,
                baseToken.decimals,
                baseToken.symbol
            );

            const token1 = new Token(
                this.config.chainId,
                quoteToken.address,
                quoteToken.decimals,
                quoteToken.symbol
            );

            // First try to compute pool address (works for Uniswap V3)
            let poolAddress = computePoolAddress({
                factoryAddress: this.factoryAddress,
                tokenA: token0,
                tokenB: token1,
                fee,
            });

            // Check if pool exists at computed address
            const code = await this.provider.getCode(poolAddress);
            
            // If no pool at computed address, query factory directly (works for PancakeSwap V3)
            if (code === '0x') {
                const factoryContract = new ethers.Contract(this.factoryAddress, FACTORY_ABI, this.provider) as any;
                poolAddress = await factoryContract.getPool(baseToken.address, quoteToken.address, fee);
                
                // If factory returns zero address, pool doesn't exist
                if (poolAddress === ethers.ZeroAddress) {
                    return null;
                }
            }

            const poolContract = new ethers.Contract(poolAddress, POOL_ABI, this.provider) as any;
            const [slot0, liquidity] = await Promise.all([
                poolContract.slot0(),
                poolContract.liquidity(),
            ]);

            if (liquidity.toString() === '0') {
                return null;
            }

            const pool = new Pool(
                token0,
                token1,
                fee,
                slot0.sqrtPriceX96.toString(),
                liquidity.toString(),
                Number(slot0.tick)
            );

            const price = parseFloat(pool.priceOf(token0).toSignificant(18));

            return {
                source: `uniswap-v3-${fee}`,
                price: this.formatPrice(price),
                metadata: {
                    feeTier: fee,
                    liquidity: liquidity.toString(),
                    tick: Number(slot0.tick),
                    poolAddress,
                },
                timestamp: this.getTimestamp(),
            };
        } catch (error) {
            const err = error as Error;
            console.error(`[UniswapV3Adapter] Error fetching pool rate for fee ${fee}:`, err.message);
            return null;
        }
    }

    private async getTokenInfo(address: string): Promise<TokenInfo> {
        const checksummed = ethers.getAddress(address);

        const cached = this.tokenCache.get(checksummed);
        if (cached) {
            return { address: checksummed, ...cached };
        }

        try {
            const contract = new ethers.Contract(checksummed, ERC20_ABI, this.provider) as any;
            const [decimals, symbol] = await Promise.all([
                contract.decimals(),
                contract.symbol(),
            ]);

            const info = { decimals: Number(decimals), symbol };
            this.tokenCache.set(checksummed, info);

            return { address: checksummed, ...info };
        } catch {
            return { address: checksummed, decimals: 18, symbol: 'UNKNOWN' };
        }
    }
}

interface TokenInfo {
    address: string;
    decimals: number;
    symbol: string;
}