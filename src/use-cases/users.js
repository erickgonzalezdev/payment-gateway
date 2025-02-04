export default class UsersUseCases {
  constructor (config = {}) {
    this.db = config.libraries.dbModels
    this.libraries = config.libraries
    this.wlogger = config.libraries.wlogger
    this.passport = config.libraries.passport

    // Bind function to this class.
    this.createUser = this.createUser.bind(this)
    this.getUser = this.getUser.bind(this)
    this.getUsers = this.getUsers.bind(this)
    this.updateUser = this.updateUser.bind(this)
    this.getUserWallets = this.getUserWallets.bind(this)
  }

  async createUser (inObj = {}) {
    try {
      const { username, password } = inObj
      if (!username || typeof username !== 'string') {
        throw new Error('username is required!')
      }

      if (!password || typeof password !== 'string') {
        throw new Error('password is required!')
      }

      const user = new this.db.Users(inObj)

      const mnemonic = await this.libraries.networks.getNewMnemonic()

      user.mnemonic = mnemonic
      await user.save()

      // generate jwt
      const token = user.generateToken()

      const userData = user.toJSON()

      userData.token = token
      // password should be omited on response
      delete userData.password
      delete userData.mnemonic
      return userData
    } catch (error) {
      this.wlogger.error(`Error in use-cases/createUser() $ ${error.message}`)
      throw error
    }
  }

  async authUser (ctx) {
    try {
      const user = await this.passport.authUser(ctx)
      if (!user) {
        const err = new Error('Unauthorized')
        err.status = 401
        throw err
      }

      const token = user.generateToken()

      const userObj = user.toJSON()

      delete userObj.password

      return {
        userObj,
        token
      }
    } catch (error) {
      this.wlogger.error(`Error in use-cases/authUser() $ ${error.message}`)
      throw error
    }
  }

  async getUser (inObj = {}) {
    try {
      const { id } = inObj

      if (!id || typeof id !== 'string') {
        throw new Error('id is required')
      }
      const user = await this.db.Users.findById(id, ['-password'])
      return user
    } catch (error) {
      this.wlogger.error(`Error in use-cases/getUser() $ ${error.message}`)
      throw error
    }
  }

  async getUsers () {
    try {
      const users = await this.db.Users.find({}, ['-password'])
      return users
    } catch (error) {
      this.wlogger.error(`Error in use-cases/getUsers() $ ${error.message}`)
      throw error
    }
  }

  async updateUser (inObj = {}) {
    try {
      const { existingData, newData } = inObj
      if (!existingData || typeof existingData !== 'object') {
        throw new Error('existingData is required!')
      }

      if (!newData || typeof newData !== 'object') {
        throw new Error('newData data is required!')
      }

      Object.assign(existingData, newData)

      // Save the changes to the database.
      await existingData.save()
      return existingData
    } catch (error) {
      this.wlogger.error(`Error in use-cases/updateUser() $ ${error.message}`)
      throw error
    }
  }

  async getUserWallets (inObj = {}) {
    try {
      const { id } = inObj
      if (!id || typeof id !== 'string') {
        throw new Error('id is required!')
      }
      const user = await this.db.Users.findById(id)

      const wallets = {}
      const multiWallet = await this.libraries.networks.createMultiHDWallets(user.mnemonic)

      const keys = Object.keys(multiWallet)

      for (let i = 0; i < keys.length; i++) {
        const chain = keys[i]
        const provider = this.libraries.networks[chain]
        const address = multiWallet[chain].address
        const balance = await provider.getBalance(address)
        wallets[chain] = {
          address,
          publicKey: multiWallet[chain].publicKey,
          balance: balance.number
        }
      }
      return wallets
    } catch (error) {
      this.wlogger.error(`Error in use-cases/createWallet() $ ${error.message}`)
      throw error
    }
  }
}
