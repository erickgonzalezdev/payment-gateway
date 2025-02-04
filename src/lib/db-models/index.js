import Users from './users.js'
import Wallets from './wallets.js'
import Payment from './payment.js'

class DbModels {
  constructor () {
    this.Users = Users
    this.Wallets = Wallets
    this.Payments = Payment
  }
}

export default DbModels
