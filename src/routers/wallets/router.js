import Router from 'koa-router'
import Controller from './controller.js'

class RouterHanlder {
  constructor (config = {}) {
    this.middleware = config.middleware

    if (!this.middleware) { throw new Error('Middleware must be provided when instantiate a Router') }

    this.controller = new Controller(config)
    this.port = config.port

    const baseUrl = '/wallets'
    this.router = new Router({ prefix: baseUrl })

    // Bind function to this class.
    this.start = this.start.bind(this)
    this.createWallet = this.createWallet.bind(this)
  }

  async start (app) {
    if (!app) { throw new Error('App is required!') }

    this.router.post('/', this.createWallet)

    app.use(this.router.routes())
    app.use(this.router.allowedMethods())
  }

  async createWallet (ctx, next) {
    await this.middleware.userValidators.ensureUser(ctx, next)
    await this.controller.createWallet(ctx, next)
  }
}

export default RouterHanlder
