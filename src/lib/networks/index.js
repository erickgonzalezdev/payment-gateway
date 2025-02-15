import EVMLib from './evm.js'
import NetworksData from './networksData.js'
import bip39 from 'bip39'
import Rate from './rate.js'
import TronLib from './tron.js'

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
    // this.op = new EVMLib(this.config)
    this.trx = new TronLib(this.config)

    // Bind
    this.start = this.start.bind(this)
    this.getNewMnemonic = this.getNewMnemonic.bind(this)
    this.decodeHex = this.decodeHex.bind(this)
  }

  async start () {
    // Ethereum
    await this.eth.start('eth')

    // Avalanche
    await this.avax.start('avax')

    /*    // Optimism
    await this.op.start('op') */

    // tron
    await this.trx.start('trx')

    /*     const tempBalance = await this.op.getBalance('0xd32585CE60815654C50CAf350e18de8096061e63')
    console.log('testBalance', tempBalance) */
  }

  async getNewMnemonic () {
    const mnemonic = this.bip39.generateMnemonic()
    return mnemonic
  }

  async createMultiHDWallets (mnemonic, hdIndex) {
    try {
      const wallets = {}

      const ethWallet = await this.eth.createHDWallet(mnemonic, hdIndex)
      const avaxWallet = await this.avax.createHDWallet(mnemonic, hdIndex)
      const trxWallet = await this.trx.createHDWallet(mnemonic, hdIndex)

      wallets.eth = ethWallet
      wallets.avax = avaxWallet
      wallets.trx = trxWallet

      return wallets
    } catch (error) {

    }
  }

  async decodeHex (hexStr) {
    try {
      return Buffer.from(hexStr, 'hex').toString()
    } catch (error) {
      console.log('error on decodeHex()')
      throw error
    }
  }
}

export default NetworksLib
