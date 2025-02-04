import Router from 'koa-router'
import Controller from './controller.js'

class RouterHanlder {
  constructor (config = {}) {
    this.middleware = config.middleware

    if (!this.middleware) { throw new Error('Middleware must be provided when instantiate a Router') }

    this.controller = new Controller(config)
    this.port = config.port

    const baseUrl = '/payments'
    this.router = new Router({ prefix: baseUrl })

    // Bind function to this class.
    this.start = this.start.bind(this)
    this.createPayment = this.createPayment.bind(this)
    this.validatePayment = this.validatePayment.bind(this)
  }

  async start (app) {
    if (!app) { throw new Error('App is required!') }

    this.router.post('/', this.createPayment)
    this.router.post('/validate', this.validatePayment)

    app.use(this.router.routes())
    app.use(this.router.allowedMethods())
  }

  async createPayment (ctx, next) {
    await this.middleware.userValidators.ensureUser(ctx, next)
    await this.controller.createPayment(ctx, next)
  }

  async validatePayment (ctx, next) {
    // await this.middleware.userValidators.ensureUser(ctx, next)
    await this.controller.validatePayment(ctx, next)
  }
}

export default RouterHanlder
