import { ethers } from 'ethers'

class FeeUtilLib {
  constructor (config = {}) {
    this.config = config
    this.provider = config.provider
    this.chain = config.chain
    this.ethers = ethers

    // bind

    this.getFee = this.getFee.bind(this)
    this.getEVMFee = this.getEVMFee.bind(this)
    this.getTronFee = this.getTronFee.bind(this)
  }

  async getFee (input = {}) {
    if (this.chain === 'eth') {
      return await this.getEVMFee(input)
    }
    if (this.chain === 'avax') {
      return await this.getEVMFee(input)
    }
    if (this.chain === 'trx') {
      return await this.getTronFee(input)
    }

    return false
  }

  async getEVMFee () {
    const block = await this.provider.getBlock('latest')
    console.log('block', block)
    let gasPrice = block.baseFeePerGas // Gas Price manual (25 Gwei)
    console.log('gasPrice', gasPrice)
    if (gasPrice < 1000000000n) gasPrice = 1000000000n
    console.log('gasPrice', gasPrice)

    const gasLimit = 21000n // Para una transacción simple de transferencia
    console.log('gasLimit', gasLimit)

    const _fee = gasPrice * gasLimit
    const fee = _fee * 2n // aditional
    console.log('fee', fee)
    console.log('ethers fee ', ethers.formatUnits(fee, 'ether'))
    return {
      gasPrice,
      gasLimit,
      fee: ethers.formatUnits(fee, 'ether')
    }
  }

  /*   async getTronFee (inObj = {}) {
    const { privateKey } = inObj
    const from = await this.provider.address.fromPrivateKey(privateKey)
    const bw = await this.provider.trx.getBandwidth(from)
    const bwPrice = await this.provider.trx.getBandwidthPrices()
    console.log('bwPrice', bwPrice)

    console.log('bw', bw)
    const feeNum = 300 * 0.0001
    return feeNum
  } */

  async getTronFee (inObj = {}) {
    const DATA_HEX_PROTOBUF_EXTRA = 2 // Add PROTBUF Overhead
    const MAX_RESULT_SIZE_IN_TX = 64 // Add fixe sized overhead for Transaction Data
    const A_SIGNATURE = 67

    const { to, amount, privateKey } = inObj
    console.log('privateKey', privateKey)
    const from = await this.provider.address.fromPrivateKey(privateKey)
    console.log('from', from)
    const transaction = await this.provider.transactionBuilder.sendTrx(to, amount, from)
    console.log('transaction', transaction)
    const rawDataLengthInHex = transaction.raw_data_hex.length

    const rawDataLengthInBytes = rawDataLengthInHex / 2

    const bandwidthConsumption = rawDataLengthInBytes +
      DATA_HEX_PROTOBUF_EXTRA +
      MAX_RESULT_SIZE_IN_TX +
      A_SIGNATURE
    console.log(`Bandwidth cost: ${bandwidthConsumption}`)

    const currentBandwith = await this.provider.trx.getBandwidth(from)
    console.log('currentBW', currentBandwith)

    const bwPrice = await this.provider.trx.getBandwidthPrices()
    console.log('bwPrice', bwPrice)

    return {
      fee: 0.0011 * bandwidthConsumption,
      bandwidthConsumption,
      from
    }
  }
}

export default FeeUtilLib
