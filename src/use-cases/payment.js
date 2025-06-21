export default class PaymentUseCases {
  constructor (config = {}) {
    this.libraries = config.libraries
    this.db = config.libraries.dbModels
    this.wlogger = config.libraries.wlogger
    this.passport = config.libraries.passport

    // Bind function to this class.
    this.createPayment = this.createPayment.bind(this)
    this.validatePayment = this.validatePayment.bind(this)
    this.handlePendingPayments = this.handlePendingPayments.bind(this)
    this.cancelPayment = this.cancelPayment.bind(this)
    this.getPaymentsByWallet = this.getPaymentsByWallet.bind(this)
    this.walletsUseCases = config.wallets
  }

  async createPayment (inObj = {}) {
    try {
      console.log('inObj', inObj)
      const { chain, amountUSD, walletId } = inObj

      const validChain = this.libraries.networks[chain]
      if (!validChain) {
        throw new Error('Invalid chain.')
      }

      if (!amountUSD || validChain.length === 0) {
        throw new Error('amountUSD must be greater than cero.')
      }

      if (!walletId || typeof walletId !== 'string') {
        throw new Error('walletId must be a string.')
      }

      const existingPayment = await this.db.Payments.find({ walletId, status: 'pending' })

      if (existingPayment && existingPayment.length > 0) throw new Error('This wallet has a pending payment.')

      await this.walletsUseCases.updateWalletAddresses({ walletId })
      const network = this.libraries.networks[chain]
      inObj.amountChain = await network.fromUSD(amountUSD)
      const wallet = await this.db.Wallets.findById(walletId)

      inObj.targetAddress = wallet.addresses[chain]
      inObj.createdAt = new Date().getTime()

      const payment = new this.db.Payments(inObj)

      await payment.save()
      console.log('payment created!', payment)

      return payment
    } catch (error) {
      console.log('createPayment error', error)
      this.wlogger.error(`Error in use-cases/createPayment() $ ${error.message}`)
      throw error
    }
  }

  // Review and handle a provided payment.
  async validatePayment (inObj = {}) {
    let payment
    try {
      const { paymentId } = inObj

      payment = await this.db.Payments.findById(paymentId)
      if (!payment) throw new Error('payment not found!')

      if (payment.status === 'completed') {
        console.log('Payment already completed.')
        return payment
      }
      console.log('payment', payment)

      // Declare network to use
      const network = this.libraries.networks[payment.chain]

      // Get target derivate wallet ( wallet with funds )
      const targetWallet = await this.db.Wallets.findById(payment.walletId)
      const targetAddresses = targetWallet.addresses
      const targetAddress = targetAddresses[payment.chain] // Address with balance.

      // Validate balance
      const balance = await network.getBalance(targetAddress)
      console.log('wallet balance', balance)
      if (balance && balance.number < payment.amountChain) {
        console.log(`${targetAddress} balance  : ${balance.number} ,  balance required ${payment.amountChain}`)
        throw new Error('Insufficient Balance')
      }

      // Get wallet owner data
      const owner = await this.db.Users.findById(targetWallet.owner)

      // Get root wallet
      const receiverWallet = await network.createWallet(owner.mnemonic)
      console.log('receiverWallet', receiverWallet)

      // Get derivate wallet
      const walletToSend = await network.createHDWallet(owner.mnemonic, targetWallet.hdIndex)

      const receiverAddress = receiverWallet.address
      const amountBig = network.toBig(payment.amountChain)
      const privateKey = walletToSend.privateKey

      const receiverCurrentBalance = await network.getBalance(receiverAddress)
      console.log('receiverCurrentBalance', receiverCurrentBalance)

      const tx = await network.send(receiverAddress, amountBig, privateKey)
      if (!tx) throw new Error('Tx Error')

      payment.status = 'completed'
      payment.completedAt = new Date().getTime()
      payment.handledTx = tx
      await payment.save()

      console.log(`Payment ${payment._id} done!  ${tx}`)
      return payment
    } catch (error) {
      await this.handleValidationErros(payment, error)
      this.wlogger.error(`Error in use-cases/validatePayment() $ ${error.message}`)
      throw error
    }
  }

  /**
   * This function automatically review all pending payments and Transfer funds from derivated wallet ( funded wallet ) to
   * Owner wallet ( root wallet ) and complete the payment status.
   *
   * This function is used by a timer controller to execute it periodically.
   *
   */
  async handlePendingPayments () {
    try {
      // Review al pending payments
      const pendingPayments = await this.db.Payments.find({ status: 'pending' })
      console.log(`Pending payments ${pendingPayments.length}`)
      for (let i = 0; i < pendingPayments.length; i++) {
        try {
          // Get payment data
          const payment = pendingPayments[i]
          await this.validatePayment({ paymentId: payment._id })
        } catch (error) {
          console.log('Error handling payment  , continue with the next one....')
          continue
        }
      }
    } catch (error) {
      this.wlogger.error(`Error in use-cases/handlePendingPayments() $ ${error}`)
      throw error
    }
  }

  async cancelPayment ({ id, user }) {
    try {
      const payment = await this.db.Payments.findById(id)
      if (!payment) throw new Error('payment not found!')
      const wallet = await this.db.Wallets.findById(payment.walletId)
      const owner = await this.db.Users.findById(wallet.owner)
      console.log('owner', owner)
      console.log('user', user)

      if (owner._id.toString() !== user._id.toString()) {
        throw new Error('Unauthorized')
      }

      if (payment.status !== 'pending') {
        throw new Error('Payment cant be cancelled')
      }

      await this.db.Payments.findOneAndDelete(payment._id)
      return true
    } catch (error) {
      this.wlogger.error(`Error in use-cases/cancelPayment() $ ${error.message}`)
      throw error
    }
  }

  async getPaymentsByWallet ({ id }) {
    try {
      const payments = await this.db.Payments.find({ walletId: id })

      return payments
    } catch (error) {
      this.wlogger.error(`Error in use-cases/getPaymentsByWallet() $ ${error.message}`)
      throw error
    }
  }

  async handleValidationErros (payment = {}, error) {
    try {
      const { validationAttemps } = payment
      if (!validationAttemps) return false
      validationAttemps.push({ error: error.message })
      await payment.save()
    } catch (error) {
      return false
    }
  }
}
