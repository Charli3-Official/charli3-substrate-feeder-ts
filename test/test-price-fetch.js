#!/usr/bin/env node
const path = require('path');
const { AdapterFactory } = require('../dist/core/adapterFactory');
const { loadConfig } = require('../dist/utils/configLoader');

async function testPriceFetching() {
    console.log('='.repeat(60));
    console.log('Multi-Chain Price Fetching Test');
    console.log('='.repeat(60));
    console.log();

    // Load config from parent directory
    const configPath = process.argv[2] || path.join(__dirname, '..', 'examples', 'consolidated.yml');
    console.log(`📋 Loading config: ${configPath}`);
    const config = loadConfig(configPath);
    
    if (!config.EVMChains || config.EVMChains.length === 0) {
        console.error('❌ No EVMChains configured!');
        process.exit(1);
    }
    
    console.log(`✅ Loaded ${config.EVMChains.length} chain(s):`);
    config.EVMChains.forEach(chain => {
        console.log(`   - ${chain.name} (Chain ID: ${chain.chain_id})`);
    });
    console.log();

    // Create adapter factory
    console.log('🏭 Creating adapter factory...');
    const factory = new AdapterFactory(config.EVMChains);
    console.log('✅ Adapter factory created');
    console.log();

    // Test each rate configuration
    const rates = Object.entries(config.Rates || {});
    
    if (rates.length === 0) {
        console.log('⚠️  No rates configured to test');
        return;
    }

    for (const [rateName, rateConfig] of rates) {
        console.log('-'.repeat(60));
        console.log(`Testing: ${rateName}`);
        console.log('-'.repeat(60));

        if (!rateConfig.base_currency?.dexes || rateConfig.base_currency.dexes.length === 0) {
            console.log('⚠️  No DEXes configured for this rate');
            continue;
        }

        for (const dexConfig of rateConfig.base_currency.dexes) {
            const chainInfo = config.EVMChains.find(c => c.chain_id === dexConfig.chain_id);
            console.log(`\n📊 Fetching from ${dexConfig.adapter} on ${chainInfo?.name || 'Unknown'} (Chain ${dexConfig.chain_id})`);
            console.log(`   Token A: ${dexConfig.asset_a}`);
            console.log(`   Token B: ${dexConfig.asset_b}`);
            console.log(`   Fee Tiers: ${dexConfig.sources?.join(', ') || 'default'}`);

            try {
                const adapter = factory.createAdapter(dexConfig);
                console.log('   ⏳ Fetching price...');
                
                const startTime = Date.now();
                const rates = await adapter.getRates();
                const duration = Date.now() - startTime;

                if (rates && rates.length > 0) {
                    console.log(`   ✅ Success! (${duration}ms)`);
                    rates.forEach((rate, idx) => {
                        const price = rate.price || rate.rate;
                        console.log(`      Rate ${idx + 1}: ${price} (Source: ${rate.source})`);
                        if (rate.metadata) {
                            console.log(`         Liquidity: ${rate.metadata.liquidity}`);
                        }
                    });
                } else {
                    console.log('   ⚠️  No rates returned (pool might not exist or have liquidity)');
                }
            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
                console.log(`   Stack: ${error.stack?.substring(0, 200)}`);
            }
        }
    }

    console.log();
    console.log('='.repeat(60));
    console.log('Test Complete');
    console.log('='.repeat(60));
}

testPriceFetching()
    .then(() => {
        console.log('\n✅ All tests completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Test failed:', error.message);
        if (process.env.DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    });
