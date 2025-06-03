const NetworksData = {
/*   eth: {
    testnet: 'https://eth-sepolia.trongrid.io',
    mainnet: 'https://eth.llamarpc.com',
    decimals: 18,
    basePath: 'm/44\'/60\'/0\'/0/0',
    name: 'ethereum',
    symbol: 'eth'
  }, */
  eth: {
    testnet: 'https://sepolia.optimism.io',
    mainnet: 'https://mainnet.optimism.io',
    decimals: 18,
    basePath: 'm/44\'/60\'/0\'/0/0',
    name: 'ethereum',
    symbol: 'eth'
  },
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
  op: {
    testnet: 'https://sepolia.optimism.io',
    mainnet: 'https://mainnet.optimism.io',
    decimals: 18,
    basePath: 'm/44\'/60\'/0\'/0/0',
    name: 'Optimism',
    symbol: 'op'
  },
  bch: {
    testnet: 'https://dev-consumer.psfoundation.infoh',
    mainnet: 'https://dev-consumer.psfoundation.info',
    decimals: 8,
    basePath: 'm/44\'/245\'/0\'/0/0',
    name: 'Bitcoin Cash',
    symbol: 'bch'
  }
}

export default NetworksData
