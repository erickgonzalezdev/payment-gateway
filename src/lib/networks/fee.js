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

  async getTronFee (inObj = {}) {
    const { privateKey } = inObj
    const from = await this.provider.address.fromPrivateKey(privateKey)
    const bw = await this.provider.trx.getBandwidth(from)
    if (bw >= 300) return 0
    return 300000
  }
}

export default FeeUtilLib
