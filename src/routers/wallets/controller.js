export default class WalletsController {
  constructor (config = {}) {
    this.useCases = config.useCases

    if (!this.useCases) { throw new Error('Uses cases must be provided when instantiate a Controller') }

    this.handleError = config.errorHandler.handleCtxError

    // Bind function to this class.
    this.createWallet = this.createWallet.bind(this)
    this.getWallet = this.getWallet.bind(this)
  }

  /**
 * @api {post} /wallets Create a new wallet
 * @apiPermission user
 * @apiName CreateWallet
 * @apiGroup Wallets
 * @apiVersion 1.0.0
 *
 * @apiExample Example usage:
 * curl -H "Content-Type: application/json" -H "Authorization: Bearer <JWT Token>" -X POST -d '{  "label": "new wallet", "description": "my new wallet"  }' localhost:5001/wallets
 *
 */
  async createWallet (ctx) {
    try {
      const inObj = ctx.request.body
      inObj.userId = ctx.state.user._id.toString()
      const wallet = await this.useCases.wallets.createWallet(inObj)
      ctx.body = {
        wallet
      }
    } catch (error) {
      this.handleError(ctx, error)
    }
  }

  async getWallet (ctx) {
    try {
      const { id } = ctx.params
      const user = await this.useCases.wallets.updateWalletAddresses({ walletId: id })
      ctx.body = user
    } catch (error) {
      this.handleError(ctx, error)
    }
  }
}
