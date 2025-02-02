import EVMLib from './evm.js'
import NetworksData from './networksData.js'

class NetworksLib {
  constructor (config = {}) {
    this.config = config
    this.config.NetworksData = NetworksData

    // start chains
    this.eth = new EVMLib(this.config)
    this.avax = new EVMLib(this.config)

    this.start = this.start.bind(this)
  }

  async start () {
    // Ethereum
    await this.eth.start('eth')

    // Avalanche
    await this.avax.start('avax')
  }
}

export default NetworksLib
