import EVMLib from './evm.js'
import NetworksData from './networksData.js'
import bip39 from 'bip39'
import Rate from './rate.js'
import TronLib from './tron.js'
import BchLib from './bch.js'
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
    this.bch = new BchLib(this.config)
    this.bnb = new EVMLib(this.config)
    // Bind
    this.start = this.start.bind(this)
    this.getNewMnemonic = this.getNewMnemonic.bind(this)
    this.decodeHex = this.decodeHex.bind(this)
  }

  async start () {
    // bch
    await this.bch.start('bch')

    // Avalanche
    await this.avax.start('avax')

    // tron
    await this.trx.start('trx')

    // eth on arbitrum
    await this.eth.start('eth')

    // bnb on binance smart chain
    await this.bnb.start('bnb')

    return true
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
      const bchWallet = await this.bch.createHDWallet(mnemonic, hdIndex)
      const bnbWallet = await this.bnb.createHDWallet(mnemonic, hdIndex)

      wallets.eth = ethWallet
      wallets.avax = avaxWallet
      wallets.trx = trxWallet
      wallets.bch = bchWallet
      wallets.bnb = bnbWallet

      return wallets
    } catch (error) {
      console.log('error on createMultiHDWallets()', error)
      throw error
    }
  }

  async decodeHex (hexStr) {
    try {
      const decodedStr = Buffer.from(hexStr, 'hex').toString()
      console.log('decodedStr', decodedStr)
      return decodedStr
    } catch (error) {
      console.log('error on decodeHex()', error)
      throw error
    }
  }
}

export default NetworksLib
