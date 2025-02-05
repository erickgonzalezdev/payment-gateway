import EVMLib from './evm.js'
import NetworksData from './networksData.js'
import bip39 from 'bip39'
import Rate from './rate.js'

class NetworksLib {
  constructor (config = {}) {
    this.config = config
    this.rate = new Rate(this.config)
    this.config.rate = this.rate
    this.config.NetworksData = NetworksData

    this.bip39 = bip39

    // start chains
    this.eth = new EVMLib(this.config)
    this.avax = new EVMLib(this.config)

    // Bind
    this.start = this.start.bind(this)
    this.getNewMnemonic = this.getNewMnemonic.bind(this)
  }

  async start () {
    // Ethereum
    await this.eth.start('eth')

    // Avalanche
    await this.avax.start('avax')
  }

  async getNewMnemonic () {
    const mnemonic = this.bip39.generateMnemonic()
    return mnemonic
  }

  async createMultiHDWallets (mnemonic, hdIndex) {
    try {
      const wallets = { }

      const ethWallet = await this.eth.createHDWallet(mnemonic, hdIndex)
      const avaxWallet = await this.avax.createHDWallet(mnemonic, hdIndex)

      wallets.eth = ethWallet
      wallets.avax = avaxWallet

      return wallets
    } catch (error) {
      console.log('error on createMultiHDWallets()')
      throw error
    }
  }
}

export default NetworksLib
