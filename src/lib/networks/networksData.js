const NetworksData = {
  avax: {
    testnet: 'https://api.avax-test.network/ext/bc/C/rpc',
    mainnet: 'https://api.avax.network/ext/bc/C/rpc',
    decimals: 18,
    basePath: 'm/44\'/60\'/0\'/0/0',
    name: 'avalanche',
    symbol: 'avax'

  },
  trx: {
    testnet: 'https://api.nileex.io',
    mainnet: 'https://api.trongrid.io',
    decimals: 6,
    basePath: 'm/44\'/195\'/0\'/0/0',
    name: 'tron',
    symbol: 'trx'

  },
  bch: {
    testnet: 'https://dev-consumer.psfoundation.info/',
    mainnet: 'https://dev-consumer.psfoundation.info/',
    decimals: 8,
    basePath: 'm/44\'/245\'/0\'/0/0',
    name: 'Bitcoin Cash',
    symbol: 'bch'
  },
  eth: {
    testnet: 'https://sepolia-rollup.arbitrum.io/rpc',
    mainnet: 'https://arb1.arbitrum.io/rpc',
    decimals: 18,
    basePath: 'm/44\'/60\'/0\'/0/0',
    name: 'Arbitrum One',
    symbol: 'eth'
  },
  bnb: {
    testnet: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    mainnet: 'https://bsc-dataseed.binance.org',
    decimals: 18,
    basePath: 'm/44\'/60\'/0\'/0/0',
    name: 'Binance Smart Chain',
    symbol: 'bnb'
  }
}

export default NetworksData
