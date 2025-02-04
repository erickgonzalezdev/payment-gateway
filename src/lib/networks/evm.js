import { Wallet } from '@ethereumjs/wallet'
import bip39 from 'bip39'
import HDKey from 'hdkey'
import Web3 from 'web3'
import { ethers } from 'ethers'
import FeeUtilLib from './fee.js'

class EVMLib {
  constructor (config = {}) {
    this.config = config
    this.appMnemonic = config.mnemonic
    this.wlogger = config.wlogger
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

    // bind
    this.start = this.start.bind(this)
    this.createWallet = this.createWallet.bind(this)
    this.createHDWallet = this.createHDWallet.bind(this)
    this.getBalance = this.getBalance.bind(this)
    this.send = this.send.bind(this)
    this.toBig = this.toBig.bind(this)
    this.toNum = this.toNum.bind(this)
  }

  async start (chainKey) {
    try {
      // get network data
      const networkData = this.config.NetworksData[chainKey]
      const url = networkData[this.config.chainEnv]
      this.decimals = networkData.decimals
      this.baseHDPath = networkData.basePath
      this.provider = new this.ethers.JsonRpcProvider(url)

      this.feeLib = new this.FeeUtilLib({ provider: this.provider, chain: chainKey })

      // start with provided env ( mainnet or testnet )
      this.wlogger.info(`Starting ${chainKey} on enviroment ${this.config.chainEnv} : ${url}`)
      this.web3 = new Web3(url)
    } catch (error) {
      this.wlogger.error('Error on EVM start()')
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

      const privateKey = this.Wallet.fromPrivateKey(addrNode.privateKey).getPrivateKeyString() // addrNode.privateKey.toString('hex')
      const publicKey = this.Wallet.fromPrivateKey(addrNode.privateKey).getPublicKeyString()// addrNode.publicKey.toString('hex')
      const derivateAddr = this.Wallet.fromPrivateKey(addrNode.privateKey).getChecksumAddressString()

      const wallet = {
        address: derivateAddr,
        privateKey,
        privateKeyHex: addrNode.privateKey.toString('hex'),
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
        privateKeyHex: addrNode.privateKey.toString('hex'),
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
      const valueAfterFee = value - this.toBig(fee)
      console.log('value before fee', this.toNum(value))
      console.log('valueAfterFee', valueAfterFee)
      const sender = this.web3.eth.accounts.wallet.add(privateKey)[0]
      const txInput = {
        from: sender.address,
        to,
        value: valueAfterFee,
        gas: gasLimit, // Gas estándar para transferencias
        gasPrice: this.toBig(gasPrice)

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
}

export default EVMLib
