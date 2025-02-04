import Users from './users/router.js'
import Wallets from './wallets/router.js'
import Payments from './payments/router.js'

export default class InitRouter {
  constructor (config = {}) {
    this.config = config
    this.users = new Users(this.config)
    this.wallets = new Wallets(this.config)
    this.payments = new Payments(this.config)

    // Bind function to this class.
    this.start = this.start.bind(this)
  }

  start (app) {
    this.users.start(app)
    this.wallets.start(app)
    this.payments.start(app)
  }
}
