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
    this.getBchFee = this.getBchFee.bind(this)
  }

  async getFee (input = {}) {
    if (this.chain === 'avax') {
      const res = await this.getEVMFee(input)
      return res
    }
    if (this.chain === 'trx') {
      const res = await this.getTronFee(input)
      return res
    }
    if (this.chain === 'bch') {
      const res = await this.getBchFee(input)
      return res
    }
    if (this.chain === 'eth') {
      const res = await this.getEVMFee(input)
      return res
    }

    return false
  }

  async getEVMFee (input = {}) {
    try {
      const { from, to } = input

      const provider = this.provider

      const feeData = await provider.getFeeData()
      console.log('feeData', feeData)
      const gasPrice = feeData.gasPrice ?? 1000000n

      // Estimar gas base
      const estimatedGas = await provider.estimateGas({
        from,
        to,
        value: 0n
      })

      const fee = estimatedGas * gasPrice

      return {
        gasLimit: estimatedGas,
        gasPrice,
        fee
      }
    } catch (error) {
      console.error('Error getting EVM fee', error)
      throw error
    }
  }

  async getTronFee (inObj = {}) {
    try {
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

      const currentBandwidth = await this.provider.trx.getBandwidth(from)
      console.log('currentBandwidth', currentBandwidth)

      // Calculate how much additional bandwidth needs to be paid for
      const requiredBandwidth = Math.max(0, bandwidthConsumption - currentBandwidth)
      console.log('Required additional bandwidth:', requiredBandwidth)

      const bwPricesStr = await this.provider.trx.getBandwidthPrices()
      console.log('bwPriceStr', bwPricesStr)
      // Parse bandwidth prices and get current price
      const currentTime = Date.now()
      const bwPrices = bwPricesStr.split(',').map(item => {
        const [timestamp, price] = item.split(':')
        return { timestamp: Number(timestamp), price: Number(price) }
      }).sort((a, b) => b.timestamp - a.timestamp)

      // Find the most recent applicable price
      const currentPrice = bwPrices.find(price => currentTime >= price.timestamp)?.price || 1000
      console.log('currentPrice', currentPrice)
      // Convert price from SUN to TRX (1 TRX = 1,000,000 SUN)
      const feeInSun = ((currentPrice * 1.7) * requiredBandwidth)
      const feeInTrx = feeInSun / 1_000_000
      console.log('feeInTrx', feeInTrx)
      console.log('feeInSun', feeInSun)

      return {
        fee: feeInTrx,
        bandwidthConsumption,
        requiredBandwidth,
        currentBandwidth,
        from,
        bandwidthPrice: currentPrice
      }
    } catch (error) {
      console.error('Error getting Tron fee', error)
      throw error
    }
  }

  async getBchFee (inObj = {}) {
    try {
      const psfFee = 2000
      const minerFee = 1000
      const fee = psfFee + minerFee
      return fee
    } catch (error) {
      console.error('Error getting BCH fee', error)
      throw error
    }
  }
}

export default FeeUtilLib
