import { Wallet } from '@ethereumjs/wallet'
import bip39 from 'bip39'
import HDKey from 'hdkey'
import Web3 from 'web3'
import { ethers } from 'ethers'
import FeeUtilLib from './fee.js'

class EVMLib {
  constructor (config = {}) {
    // Injection
    this.config = config
    this.appMnemonic = config.mnemonic
    this.wlogger = config.wlogger
    this.rate = config.rate

    // Encapsulate
    this.Wallet = Wallet
    this.bip39 = bip39
    this.HDKey = HDKey
    this.Networks = this.config.Networks
    this.decimals = this.config.decimals
    this.ethers = ethers
    this.FeeUtilLib = FeeUtilLib

    // declared on runtime
    this.web3 = null
    this.decimals = null
    this.baseHDPath = null
    this.provider = null
    this.feeLib = null
    this.networkData = null
    this.chainKey = null

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
      this.chainKey = chainKey
      // get network data
      this.networkData = this.config.NetworksData[chainKey]
      const url = this.networkData[this.config.chainEnv]
      this.decimals = this.networkData.decimals
      this.baseHDPath = this.networkData.basePath
      this.provider = new this.ethers.JsonRpcProvider(url)

      this.feeLib = new this.FeeUtilLib({ provider: this.provider, chain: chainKey })

      // start with provided env ( mainnet or testnet )
      this.wlogger.info(`Starting ${chainKey} on enviroment ${this.config.chainEnv} : ${url}`)
      this.web3 = new Web3(url)

      await this.verifyConnection() // Ensure connection
    } catch (error) {
      this.wlogger.error('Error on EVM start()')
      throw error
    }
  }

  async verifyConnection () {
    try {
      const block = await this.web3.eth.getBlock('latest')
      console.log(`Connected to : ${this.chainKey}`, !!block)
    } catch (error) {
      console.error('Error on EVM connection:', error)
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
      console.log('path', hdPath)
      const addrNode = root.derive(hdPath)

      const privateKey = this.Wallet.fromPrivateKey(addrNode.privateKey).getPrivateKeyString() // addrNode.privateKey.toString('hex')
      const publicKey = this.Wallet.fromPrivateKey(addrNode.privateKey).getPublicKeyString()// addrNode.publicKey.toString('hex')
      const derivateAddr = this.Wallet.fromPrivateKey(addrNode.privateKey).getChecksumAddressString()

      const wallet = {
        address: derivateAddr,
        privateKey,
        //     privateKeyHex: addrNode.privateKey.toString('hex'),
        publicKey,
        hdIndex: hdIndex || null
      }

      return wallet
    } catch (error) {
      this.wlogger.error('Error on EVM createHDWallet()')
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

      const privateKey = this.Wallet.fromPrivateKey(addrNode.privateKey).getPrivateKeyString() // addrNode.privateKey.toString('hex')
      const publicKey = this.Wallet.fromPrivateKey(addrNode.privateKey).getPublicKeyString()// addrNode.publicKey.toString('hex')
      const derivateAddr = this.Wallet.fromPrivateKey(addrNode.privateKey).getChecksumAddressString()

      const wallet = {
        mnemonic,
        address: derivateAddr,
        privateKey,
        //  privateKeyHex: addrNode.privateKey.toString('hex'),
        publicKey,
        hdIndex: 0
      }

      return wallet
    } catch (error) {
      this.wlogger.error('Error on EVM createWallet()')
      throw error
    }
  }

  async getBalance (addr) {
    try {
      const balance = await this.web3.eth.getBalance(addr)
      return {
        big: balance,
        number: Number(balance) / Number((10 ** this.decimals))
      }
    } catch (error) {
      this.wlogger.error('Error on EVM getBalance()')
      throw error
    }
  }

  async send (to, value, privateKey) {
    try {
      const { fee, gasLimit, gasPrice } = await this.feeLib.getFee({})
      console.log('fee', fee)
      console.log('num fee', this.toNum(fee))
      const valueAfterFee = value - this.toBig(fee)
      console.log('value before fee', this.toNum(value))
      console.log('valueAfterFee', this.toNum(valueAfterFee))
      const sender = this.web3.eth.accounts.wallet.add(privateKey)[0]

      console.log('spent amount :', valueAfterFee + gasLimit * gasPrice)
      const txInput = {
        from: sender.address,
        to,
        value: valueAfterFee,
        gasLimit, // Gas estándar para transferencias
        gasPrice

      }

      console.log('txinput', txInput)
      const receipt = await this.web3.eth.sendTransaction(txInput)

      // console.log(receipt.transactionHash)
      return receipt.transactionHash
    } catch (error) {
      this.wlogger.error('Error on EVM send()')
      throw error
    }
  }

  toBig (value) {
    try {
      return BigInt(Math.round(value * (10 ** this.decimals)))
    } catch (error) {
      this.wlogger.error('Error on EVM toBig()')
      throw error
    }
  }

  toNum (value) {
    try {
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

export default EVMLib
