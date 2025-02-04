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
  }

  async getFee (input = {}) {
    if (this.chain === 'eth') {
      return await this.getEVMFee(input)
    }
    if (this.chain === 'avax') {
      return await this.getEVMFee(input)
    }

    return false
  }

  async getEVMFee () {
    const block = await this.provider.getBlock('latest')
    const gasPrice = ethers.formatUnits(block.baseFeePerGas, 'ether') // Gas Price manual (25 Gwei)
    const gasLimit = 21000 // Para una transacción simple de transferencia

    const fee = gasPrice * gasLimit
    return {
      gasPrice,
      gasLimit,
      fee
    }
  }
}

export default FeeUtilLib
