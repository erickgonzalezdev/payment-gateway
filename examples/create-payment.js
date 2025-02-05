import axios from 'axios'
import config from '../config.js'
const LOCALHOST = `http://localhost:${config.port}`

const start = async () => {
  try {
    const user = await authUser()
    console.log('user', user)
    const wallet = await createWallet(user.token)
    console.log('wallet', wallet)

    const paymentObj = {
      walletId: wallet._id,
      amountUSD: 1.99,
      chain: 'eth'
    }
    const payment = await createPayment(paymentObj, user.token)

    console.log('payment', payment)
  } catch (error) {
    console.log(error)
    console.log(error.response.data)
  }
}

const authUser = async () => {
  const options = {
    method: 'POST',
    url: `${LOCALHOST}/users/auth`,
    data: {
      username: 'newUser',
      password: 'mypass'
    }
  }
  const result = await axios(options)
  return result.data
}

const createWallet = async (token) => {
  const options = {
    method: 'POST',
    url: `${LOCALHOST}/wallets`,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`
    },
    data: {
      label: 'new hd wallet',
      description: 'derivated wallet from user'
    }
  }
  const result = await axios(options)
  return result.data.wallet
}

const createPayment = async (data, token) => {
  const options = {
    method: 'POST',
    url: `${LOCALHOST}/payments`,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`
    },
    data
  }
  const result = await axios(options)
  return result.data
}

start()
