import { readFileSync } from 'fs';
import * as yaml from 'yaml';
import * as dotenv from 'dotenv';
import { AppConfig } from '../types/config';

// Load environment variables from .env file if it exists
dotenv.config();

/**
 * Substitute environment variables in a string
 * Supports ${VAR}, $VAR, and __VAR__ formats
 */
function substituteEnvVars(content: string): string {
    // Replace ${VAR} and $VAR
    let substituted = content.replace(/\${?(\w+)}?/g, (match, name) => {
        return process.env[name] || match;
    });
    
    // Replace __VAR__ (used in Docker templates)
    substituted = substituted.replace(/__(\w+)__/g, (match, name) => {
        return process.env[name] || match;
    });

    return substituted;
}

/**
 * Load and parse YAML configuration file with environment variable substitution
 */
export function loadConfig(configPath: string): AppConfig {
    try {
        const fileContents = readFileSync(configPath, 'utf8');
        const substitutedContents = substituteEnvVars(fileContents);
        const config = yaml.parse(substitutedContents) as AppConfig;

        // Validate required fields
        if (!config.Logger) {
            throw new Error('Missing Logger configuration');
        }
        if (!config.EVMChains || config.EVMChains.length === 0) {
            throw new Error('Missing EVMChains configuration. Please update to the new multi-chain format.');
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