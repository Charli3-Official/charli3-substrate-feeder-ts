export interface LoggerConfig {
    verbosity: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
}

export interface EVMChainConfig {
    chain_id: number;
    name: string;
    rpc_url: string;
    factory_address: string;
    max_concurrent?: number;
}

export interface SubstrateConfig {
    node_url: string;
}

export interface DexConfig {
    adapter: string;
    asset_a: string;
    asset_b: string;
    quote_required?: boolean;
    quote_calc_method?: 'multiply' | 'divide';
    sources: string[];
    chain_id: number;  // Now required!
}

export interface CurrencyConfig {
    dexes?: DexConfig[];
}

export interface RateConfig {
    general_base_symbol: string;
    general_quote_symbol?: string | null;
    base_currency: CurrencyConfig;
    quote_currency?: CurrencyConfig;
}

export interface AppConfig {
    Logger: LoggerConfig;
    EVMChains: EVMChainConfig[];  // Now required!
    Substrate?: SubstrateConfig;
    Rates: Record<string, RateConfig>;
}