export default class WalletsController {
  constructor (config = {}) {
    this.useCases = config.useCases

    if (!this.useCases) { throw new Error('Uses cases must be provided when instantiate a Controller') }

    this.handleError = config.errorHandler.handleCtxError

    // Bind function to this class.
    this.createPayment = this.createPayment.bind(this)
    this.validatePayment = this.validatePayment.bind(this)
    this.cancelPayment = this.cancelPayment.bind(this)
    this.getPaymentsByWallet = this.getPaymentsByWallet.bind(this)
  }

  /**
 * @api {post} /payments Create a new Payment
 * @apiPermission user
 * @apiName CreatePayment
 * @apiGroup Payments
 * @apiVersion 1.0.0
 *
 * @apiExample Example usage:
 * curl -H "Content-Type: application/json" -H "Authorization: Bearer <JWT Token>" -X POST -d '{  "walletId": "my wallet Id", "chain": "tron" , "amount" : 1  }' localhost:5001/payments
 *
 *
 */
  async createPayment (ctx) {
    try {
      const inObj = ctx.request.body
      const payment = await this.useCases.payments.createPayment(inObj)
      ctx.body = {
        payment
      }
    } catch (error) {
      this.handleError(ctx, error)
    }
  }

  /**
 * @api {post} /payments/validate Validate Payment
 * @apiPermission user
 * @apiName ValidatePayment
 * @apiGroup Payments
 * @apiVersion 1.0.0
 *
 * @apiExample Example usage:
 * curl -H "Content-Type: application/json" -H "Authorization: Bearer <JWT Token>" -X POST -d '{  "paymentId": "paymentId" }' localhost:5001/payments/validate
 *
 *
 */
  async validatePayment (ctx) {
    try {
      const inObj = ctx.request.body
      const payment = await this.useCases.payments.validatePayment(inObj)
      ctx.body = {
        payment
      }
    } catch (error) {
      this.handleError(ctx, error)
    }
  }

  /**
* @api {delete} /payments/cancel Cancel Payment
* @apiPermission user
* @apiName CancelPayment
* @apiGroup Payments
* @apiVersion 1.0.0
*
* @apiExample Example usage:
* curl -H "Content-Type: application/json" -H "Authorization: Bearer <JWT Token>" -X DELETE  localhost:5001/payments/cancel/<id>
*
*
*/
  async cancelPayment (ctx) {
    try {
      const obj = {
        id: ctx.params.id,
        user: ctx.state.user
      }
      const success = await this.useCases.payments.cancelPayment(obj)
      ctx.body = {
        success
      }
    } catch (error) {
      this.handleError(ctx, error)
    }
  }

  /**
* @api {get} /payments/wallet<walletId> Get all Payments By Wallet
* @apiPermission user
* @apiName GetPaymentsByWallet
* @apiGroup Payments
* @apiVersion 1.0.0
*
* @apiExample Example usage:
* curl -H "Content-Type: application/json" -H "Authorization: Bearer <JWT Token>" -X GET localhost:5001/payments/wallet/<walletId>
*
*
*/
  async getPaymentsByWallet (ctx) {
    try {
      const payments = await this.useCases.payments.getPaymentsByWallet(ctx.params)
      ctx.body = payments
    } catch (error) {
      this.handleError(ctx, error)
    }
  }
}
