import BchWallet from 'minimal-slp-wallet'
import bip39 from 'bip39'
import FeeUtilLib from './fee.js'

class BCH {
  constructor (config = {}) {
    // Injection
    this.config = config
    this.appMnemonic = config.mnemonic
    this.wlogger = config.wlogger
    this.rate = config.rate

    // Encapsulate
    this.Networks = this.config.Networks
    this.decimals = this.config.decimals
    this.BchWallet = BchWallet
    this.bip39 = bip39
    this.FeeUtilLib = FeeUtilLib
    // bind
    this.start = this.start.bind(this)
    this.createWallet = this.createWallet.bind(this)
    this.createHDWallet = this.createHDWallet.bind(this)
    this.getBalance = this.getBalance.bind(this)
    this.send = this.send.bind(this)
    this.toBig = this.toBig.bind(this)
    this.toNum = this.toNum.bind(this)
    this.verifyConnection = this.verifyConnection.bind(this)
  }

  async start (chainKey) {
    try {
      if (!chainKey) throw new Error('chainKey must be provided when start BCH!')
      this.chainKey = chainKey
      // get network data
      this.networkData = this.config.NetworksData[chainKey]
      if (!this.networkData) throw new Error(`Network data not found for chainKey: ${chainKey}`)
      this.url = this.networkData[this.config.chainEnv]
      this.decimals = this.networkData.decimals
      this.baseHDPath = this.networkData.basePath

      this.feeLib = new this.FeeUtilLib({ chain: chainKey })

      // start with provided env ( mainnet or testnet )
      this.wlogger.info(`Starting ${chainKey} on enviroment ${this.config.chainEnv} : ${this.url}`)

      await this.verifyConnection() // Ensure connection
    } catch (error) {
      this.wlogger.error('Error on BCH start()')
      throw error
    }
  }

  async verifyConnection () {
    try {
      const wallet = new this.BchWallet(undefined, {
        interface: 'consumer-api',
        restURL: this.networkData.network,
        hdPath: this.baseHDPath
      })

      this.consumerWallet = wallet
      this.bchjs = wallet.bchjs
      const block = await wallet.bchjs.Blockchain.getBlockchainInfo()
      console.log(`Connected to : ${this.chainKey}`, !!block)
      return true
    } catch (error) {
      console.error('Error on BCH connection:', error)
      throw error
    }
  }

  async createHDWallet (mnemonic, hdIndex) {
    try {
      console.log('createHDWallet', mnemonic, hdIndex)
      if (!mnemonic) throw new Error('mnemonic must be provided when create a new hd wallet!')

      let hdPath = this.baseHDPath
      if (hdIndex) {
        hdPath = `${this.baseHDPath}/${hdIndex}`
      }
      const walletOptions = {
        interface: 'consumer-api',
        restURL: this.networkData.network,
        hdPath
      }
      const wallet = new this.BchWallet(mnemonic, walletOptions)
      await wallet.walletInfoPromise
      return {
        mnemonic,
        address: wallet.walletInfo.address,
        privateKey: wallet.walletInfo.privateKey,
        //     privateKeyHex: addrNode.privateKey.toString('hex'),
        publicKey: wallet.walletInfo.publicKey,
        hdIndex: hdIndex || null
      }
    } catch (error) {
      console.error('Error on BCH createHDWallet()', error)
      this.wlogger.error('Error on BCH createHDWallet()')
      throw error
    }
  }

  async createWallet (mnemonicInput) {
    try {
      const mnemonic = mnemonicInput || this.bip39.generateMnemonic()

      console.log('createWallet', mnemonic)
      if (!mnemonic) throw new Error('mnemonic must be provided when create a new hd wallet!')

      const hdPath = this.baseHDPath

      const walletOptions = {
        interface: 'consumer-api',
        restURL: this.networkData.network,
        hdPath
      }
      const wallet = new this.BchWallet(mnemonic, walletOptions)
      await wallet.walletInfoPromise
      return {
        mnemonic,
        address: wallet.walletInfo.address,
        privateKey: wallet.walletInfo.privateKey,
        //     privateKeyHex: addrNode.privateKey.toString('hex'),
        publicKey: wallet.walletInfo.publicKey,
        hdIndex: 0
      }
    } catch (error) {
      this.wlogger.error('Error on BCH createWallet()')
      throw error
    }
  }

  async getBalance (addr) {
    try {
      if (!addr) throw new Error('Address must be provided when getting balance')
      const balanceRes = await this.bchjs.Electrumx.balance(addr)// this.consumerWallet.getBalance(addr)
      console.log('balance for address', addr, balanceRes)
      const balance = balanceRes.balance.confirmed + balanceRes.balance.unconfirmed
      return {
        big: balance,
        number: Number(balance) / Number((10 ** this.decimals))
      }
    } catch (error) {
      this.wlogger.error('Error on BCH getBalance()')
      throw error
    }
  }

  async send (to, value, privateKey) {
    try {
      const bchWallet = new this.BchWallet(privateKey, {
        interface: 'consumer-api',
        restURL: this.networkData.network
      })
      await bchWallet.walletInfoPromise
      await bchWallet.initialize()
      const fee = await this.feeLib.getFee()
      const receivers = [
        {
          address: to,
          amountSat: Number(value) - fee
        }
      ]
      console.log('receiver', receivers)
      const tx = await bchWallet.send(receivers)
      console.log('tx', tx)
      return tx
    } catch (error) {
      this.wlogger.error('Error on BCH send()')
      throw error
    }
  }

  toBig (value) {
    try {
      if (typeof value !== 'number') {
        throw new Error('Value must be a number when converting to BigInt')
      }
      return BigInt(Math.round(value * (10 ** this.decimals)))
    } catch (error) {
      this.wlogger.error('Error on BCH toBig()')
      throw error
    }
  }

  toNum (value) {
    try {
      if (typeof value !== 'bigint') {
        throw new Error('Value must be a BigInt when converting to number')
      }
      return Number(value) / Number((10 ** this.decimals))
    } catch (error) {
      this.wlogger.error('Error on BCH toNum()')
      throw error
    }
  }

  async toUSD (valueCoin) {
    try {
      const usdPrice = await this.rate.getUSDPrice(this.networkData.symbol)
      const valueUSD = usdPrice * valueCoin
      return valueUSD.toFixed(2)
    } catch (error) {
      this.wlogger.error('Error on BCH toUSD()')
      throw error
    }
  }

  async fromUSD (valueUSD) {
    try {
      const usdPrice = await this.rate.getUSDPrice(this.networkData.symbol)
      const value = valueUSD / usdPrice
      return value.toPrecision(5)
    } catch (error) {
      this.wlogger.error('Error on BCH fromUSD()')
      throw error
    }
  }
}

export default BCH
