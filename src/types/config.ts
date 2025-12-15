export interface LoggerConfig {
    verbosity: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
}

export interface EVMQueryConfig {
    rpc_url: string;
    chain_id: number;
    max_concurrent?: number;
}

export interface DexConfig {
    adapter: string;
    asset_a: string;
    asset_b: string;
    quote_required?: boolean;
    quote_calc_method?: 'multiply' | 'divide';
    sources: string[];
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
    EVMQuery: EVMQueryConfig;
    Rates: Record<string, RateConfig>;
}