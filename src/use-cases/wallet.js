export default class WalletUseCases {
  constructor (config = {}) {
    this.libraries = config.libraries
    this.db = config.libraries.dbModels
    this.wlogger = config.libraries.wlogger
    this.passport = config.libraries.passport

    // Bind function to this class.
    this.createWallet = this.createWallet.bind(this)
  }

  async createWallet (inObj = {}) {
    try {
      const { userId, label, description } = inObj
      if (!userId || typeof userId !== 'string') {
        throw new Error('userId is required!')
      }

      const user = await this.db.Users.findById(userId)

      const lastHdIndex = user.walletsCount

      const hdIndex = lastHdIndex + 1

      const wallet = new this.db.Wallets()
      wallet.hdIndex = hdIndex
      wallet.owner = userId
      wallet.label = label
      wallet.description = description

      const multiWallet = await this.libraries.networks.createMultiHDWallets(user.mnemonic, hdIndex)
      const keys = Object.keys(multiWallet)

      // Asign address
      const addresses = {}
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        addresses[key] = multiWallet[key].address
      }

      wallet.addresses = addresses

      await wallet.save()

      user.walletsCount++
      await user.save()

      return wallet
    } catch (error) {
      this.wlogger.error(`Error in use-cases/createWallet() $ ${error.message}`)
      throw error
    }
  }
}
