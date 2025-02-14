const env = process.env.ENVIROMENT || 'development'
const rateURL1 = env === 'test' ? 'testurl' : ''
const config = {
  database: `payment-gateway-${env.toLocaleLowerCase()}`,
  port: process.env.PORT || 5001,
  passKey: process.env.PASS_KEY || 'user-password-salt-key',
  koaSessionKey: 'koa-session-secret-key',
  env,
  chainEnv: process.env.CHAIN_ENV || 'testnet',
  tronKey: process.env.TRON_KEY || 'tron-key',
  rateURL1: process.env.RATE_URL_1 || rateURL1
}

export default config
