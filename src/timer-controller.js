export default class TimerController {
  constructor (config = {}) {
    this.config = config
    // Dependency Injection.
    this.useCases = config.useCases
    if (!this.useCases) {
      throw new Error(
        'Instance of Use Cases library required when instantiating Timer Controller libraries.'
      )
    }

    this.setInterval = setInterval
    this.clearInterval = clearInterval
    this.wlogger = this.useCases.payments.wlogger
    // State
    this.handlePendingPaymentsPeriod = 35000

    this.startTimers = this.startTimers.bind(this)
    // this.handlePendingPayments = this.handlePendingPayments.bind(this)
  }

  startTimers () {
    // this.wlogger.info(`Starting handlePendingPayments interval of ${this.handlePendingPaymentsPeriod / 60000} minutes`)
    // this.handlePendingPaymentsTimer = this.setInterval(this.handlePendingPayments, this.handlePendingPaymentsPeriod)
    // this.handlePendingPayments()
    return true
  }

  /*
  // Stop time-intervals
  stopTimers () {
    clearInterval(this.handleUnpinedTimer)
  }
 */
/*   // Review al payments with status "pending"
  async handlePendingPayments () {
    try {
      // Stop interval
      this.clearInterval(this.handlePendingPaymentsTimer)

      this.wlogger.info('Stopped handlePendingPaymentsTimers interval , waiting for handler to be done!.')
      await this.useCases.payments.handlePendingPayments()

      // After finish process re-start the interval
      this.wlogger.info(`Starting handlePendingPayments interval of ${this.handlePendingPaymentsPeriod / 60000} minutes`)
      this.handlePendingPaymentsTimer = this.setInterval(this.handlePendingPayments, this.handlePendingPaymentsPeriod)

      return true
    } catch (error) {
      // On error re-start the interval
      this.wlogger.info(`Starting handlePendingPayments interval of ${this.handlePendingPaymentsPeriod / 60000} minutes`)
      this.handlePendingPaymentsTimer = this.setInterval(this.handlePendingPayments, this.handlePendingPaymentsPeriod)
      return false
    }
  } */
}
