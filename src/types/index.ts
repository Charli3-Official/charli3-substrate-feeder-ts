export interface Rate {
    source: string;
    price: number;
    metadata: Record<string, any>;
    timestamp: number;
}

export interface AdapterConfig {
    rpcUrl: string;
    chainId: number;
    maxConcurrent?: number;
}

export interface PriceRequest {
    baseAsset: string;
    quoteAsset: string;
    sources?: string[];
}


export interface PriceResponse {
    success: boolean;
    data?: {
        pair: string;
        rates: Rate[];
    }[];
    error?: string;
}