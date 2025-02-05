const env = process.env.ENVIROMENT || 'development'

const config = {
  database: `payment-gateway-${env.toLocaleLowerCase()}`,
  port: process.env.PORT || 5001,
  passKey: process.env.PASS_KEY || 'user-password-salt-key',
  koaSessionKey: 'koa-session-secret-key',
  env,
  chainEnv: process.env.CHAIN_ENV || 'testnet',
  rateURL1: process.env.RATE_URL_1
}

export default config
