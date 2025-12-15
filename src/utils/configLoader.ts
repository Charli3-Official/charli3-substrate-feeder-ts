import { readFileSync } from 'fs';
import * as yaml from 'yaml';
import { AppConfig } from '../types/config';

/**
 * Load and parse YAML configuration file
 */
export function loadConfig(configPath: string): AppConfig {
    try {
        const fileContents = readFileSync(configPath, 'utf8');
        const config = yaml.parse(fileContents) as AppConfig;

        // Validate required fields
        if (!config.Logger) {
            throw new Error('Missing Logger configuration');
        }
        if (!config.EVMQuery) {
            throw new Error('Missing EVMQuery configuration');
        }
        if (!config.Rates || Object.keys(config.Rates).length === 0) {
            throw new Error('Missing or empty Rates configuration');
        }

        return config;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to load config from ${configPath}: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Get log level from config
 */
export function getLogLevel(verbosity: string): string {
    const levels: Record<string, string> = {
        DEBUG: 'debug',
        INFO: 'info',
        WARN: 'warn',
        ERROR: 'error',
    };
    return levels[verbosity] || 'info';
}