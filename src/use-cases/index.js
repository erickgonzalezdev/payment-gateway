import UsersUseCases from './users.js'
import WalletUseCases from './wallet.js'
import PaymentUseCases from './payment.js'

export default class UseCases {
  constructor (config = {}) {
    if (!config.libraries) { throw new Error('Libraries instance should be passed in UseCases Constructor.') }

    this.users = new UsersUseCases(config)
    this.wallets = new WalletUseCases(config)
    this.payments = new PaymentUseCases(config)
  }
}
