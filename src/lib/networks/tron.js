import { Wallet } from '@ethereumjs/wallet'
import bip39 from 'bip39'
import HDKey from 'hdkey'
import { ethers } from 'ethers'
import FeeUtilLib from './fee.js'
import { TronWeb } from 'tronweb'

class TronLib {
  constructor (config = {}) {
    // Injection
    this.config = config
    this.appMnemonic = config.mnemonic
    this.wlogger = config.wlogger
    this.rate = config.rate
    this.tronKey = config.tronKey

    // Encapsulate
    this.Wallet = Wallet
    this.bip39 = bip39
    this.HDKey = HDKey
    this.Networks = this.config.Networks
    this.decimals = this.config.decimals
    this.ethers = ethers
    this.FeeUtilLib = FeeUtilLib
    this.TronWeb = TronWeb

    // declared on runtime
    this.web3 = null
    this.decimals = null
    this.baseHDPath = null
    this.provider = null
    this.feeLib = null
    this.networkData = null

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
      if (!this.tronKey) throw new Error('Tron Api Key must be provided!')
      if (!chainKey) throw new Error('chainKey must be provided when start tron!')
      this.chainKey = chainKey
      // get network data
      this.networkData = this.config.NetworksData[chainKey]
      if (!this.networkData) throw new Error('Network data not found for chainKey')
      const url = this.networkData[this.config.chainEnv]
      this.decimals = this.networkData.decimals
      this.baseHDPath = this.networkData.basePath

      this.provider = new this.TronWeb({
        fullHost: url,
        headers: { 'TRON-PRO-API-KEY': this.tronKey }
        // privateKey: wallet.privateKeyHex
      })

      this.feeLib = new this.FeeUtilLib({ provider: this.provider, chain: chainKey })

      // start with provided env ( mainnet or testnet )
      this.wlogger.info(`Starting ${chainKey} on enviroment ${this.config.chainEnv} : ${url}`)

      await this.verifyConnection()
      return true
    } catch (error) {
      this.wlogger.error('Error on Tron start()')
      throw error
    }
  }

  async verifyConnection () {
    try {
      const block = await this.provider.trx.getCurrentBlock()
      console.log(`Connected to : ${this.chainKey}`, !!block)
      return true
    } catch (error) {
      console.error('Error on tron/verifyConection:', error)
      throw error
    }
  }

  async createHDWallet (mnemonic, hdIndex) {
    try {
      if (!mnemonic) throw new Error('mnemonic must be provided when create a new hd wallet!')
      // TODO: validate if hdIndex is currently used by another user.
      const seed = await this.bip39.mnemonicToSeed(mnemonic) // creates seed buffer

      const root = this.HDKey.fromMasterSeed(seed)

      let hdPath = this.baseHDPath
      if (hdIndex) {
        hdPath = `${this.baseHDPath}/${hdIndex}`
      }
      const addrNode = root.derive(hdPath)
      console.log('this.wallet', this.Wallet.fromPrivateKey)
      // const privateKey = this.Wallet.fromPrivateKey(addrNode.privateKey).getPrivateKeyString() // addrNode.privateKey.toString('hex')
      const publicKey = this.Wallet.fromPrivateKey(addrNode.privateKey).getPublicKeyString()// addrNode.publicKey.toString('hex')
      // const derivateAddr = this.Wallet.fromPrivateKey(addrNode.privateKey).getChecksumAddressString()
      const keyHex = addrNode.privateKey.toString('hex')
      const wallet = {
        address: this.provider.address.fromPrivateKey(keyHex),
        privateKey: keyHex,
        publicKey,
        hdIndex: hdIndex || null,
        mnemonic
      }

      return wallet
    } catch (error) {
      console.log('error', error)
      this.wlogger.error('Error on Tron createHDWallet()')
      throw error
    }
  }

  async createWallet (mnemonicInput) {
    try {
      const mnemonic = mnemonicInput || this.bip39.generateMnemonic()

      const seed = await this.bip39.mnemonicToSeed(mnemonic) // creates seed buffer

      const root = this.HDKey.fromMasterSeed(seed)

      const hdPath = this.baseHDPath
      const addrNode = root.derive(hdPath)

      // const privateKey = this.Wallet.fromPrivateKey(addrNode.privateKey).getPrivateKeyString() // addrNode.privateKey.toString('hex')
      const publicKey = this.Wallet.fromPrivateKey(addrNode.privateKey).getPublicKeyString()// addrNode.publicKey.toString('hex')
      // const derivateAddr = this.Wallet.fromPrivateKey(addrNode.privateKey).getChecksumAddressString()

      const keyHex = addrNode.privateKey.toString('hex')

      const wallet = {
        address: this.provider.address.fromPrivateKey(keyHex),
        privateKey: keyHex,
        publicKey,
        hdIndex: 0,
        mnemonic
      }

      return wallet
    } catch (error) {
      this.wlogger.error('Error on Tron createWallet()')
      throw error
    }
  }

  async getBalance (addr) {
    try {
      if (!addr) throw new Error('Address must be provided when getting balance')
      const balance = await this.provider.trx.getBalance(addr)
      return {
        big: balance,
        number: Number(balance) / Number((10 ** this.decimals))
      }
    } catch (error) {
      this.wlogger.error('Error on Tron getBalance()')
      throw error
    }
  }

  async send (to, value, privateKey) {
    try {
      if (!to) throw new Error('Address must be provided when sending')
      if (!value) throw new Error('Value must be provided when sending')
      if (!privateKey) throw new Error('Private key must be provided when sending')
      console.log('send to', to)
      const { fee } = await this.feeLib.getFee({ privateKey, to, amount: value })
      console.log('fee', this.toBig(fee))

      const toSend = value - this.toBig(fee)
      console.log('toSend', this.toNum(toSend))
      const txInput = {
        to,
        value: toSend,
        privateKey
      }

      console.log('txInput', txInput)
      const receipt = await this.provider.trx.send(txInput.to, txInput.value, txInput.privateKey)
      console.log('receipt', receipt)

      if (!receipt.result) {
        let errMsg = 'Transaction Error'
        if (receipt.message) errMsg = Buffer.from(receipt.message, 'hex').toString()
        throw new Error(errMsg)
      }
      // console.log(receipt.transactionHash)
      return receipt.transaction.txID
    } catch (error) {
      console.log('error.message', error.message)
      this.wlogger.error('Error on Tron send()')
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
      this.wlogger.error('Error on EVM toBig()')
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
      this.wlogger.error('Error on EVM toNum()')
      throw error
    }
  }

  async toUSD (valueCoin) {
    try {
      const usdPrice = await this.rate.getUSDPrice(this.networkData.symbol)
      const valueUSD = usdPrice * valueCoin
      return valueUSD.toFixed(2)
    } catch (error) {
      this.wlogger.error('Error on EVM toUSD()')
      throw error
    }
  }

  async fromUSD (valueUSD) {
    try {
      const usdPrice = await this.rate.getUSDPrice(this.networkData.symbol)
      const value = valueUSD / usdPrice
      return value.toPrecision(5)
    } catch (error) {
      this.wlogger.error('Error on EVM fromUSD()')
      throw error
    }
  }
}

export default TronLib
