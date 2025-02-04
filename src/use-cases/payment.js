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
  }

  async createPayment (inObj = {}) {
    try {
      const { chain, amount, walletId } = inObj

      const validChain = this.libraries.networks[chain]
      if (!validChain) {
        throw new Error('Invalid chain.')
      }

      if (!amount || validChain.length === 0) {
        throw new Error('Amount must be greater than cero.')
      }

      if (!amount || typeof walletId !== 'string') {
        throw new Error('walletId must be a string.')
      }

      const existingPayment = await this.db.Payments.find({ walletId, status: 'pending' })

      if (existingPayment && existingPayment.length > 0) throw new Error('This wallet has a pending payment.')

      const wallet = await this.db.Wallets.findById(walletId)

      inObj.targetAddress = wallet.addresses[chain]
      inObj.createdAt = new Date().getTime()

      const payment = new this.db.Payments(inObj)

      await payment.save()

      return payment
    } catch (error) {
      this.wlogger.error(`Error in use-cases/createPayment() $ ${error.message}`)
      throw error
    }
  }

  // Review and handle a provided payment.
  async validatePayment (inObj = {}) {
    try {
      const { paymentId } = inObj

      const payment = await this.db.Payments.findById(paymentId)
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
      if (balance && balance.number < payment.amount) {
        console.log(`${targetAddress} balance  : ${balance.number} ,  balance required ${payment.amount}`)
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
      const amountBig = network.toBig(payment.amount)
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
}
