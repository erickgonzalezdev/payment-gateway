import { assert } from 'chai'
import sinon from 'sinon'

import EVMLib from '../../../../src/lib/networks/evm.js'
import Libraries from '../../../../src/lib/index.js'
import UseCases from '../../../../src/use-cases/index.js'
import { cleanDb, startDb } from '../../../util/test-util.js'
import config from '../../../../config.js'
import NetworksData from '../../../../src/lib/networks/networksData.js'

describe('#EVM', () => {
  let uut
  let sandbox

  before(async () => {
    const libraries = new Libraries(config)

    const useCases = new UseCases({ libraries })

    uut = new EVMLib({ useCases, wlogger: { info: () => { }, error: () => { } }, NetworksData })
    uut.rate = {
      getUSDPrice: () => { }
    }
    await startDb()
    await cleanDb()
  })

  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(async () => {
    await cleanDb()
  })

  describe('#start', () => {
    it('should start evm network', async () => {
      sandbox.stub(uut, 'verifyConnection').resolves()

      const res = await uut.start('eth')
      assert.isTrue(res)
    })
    it('should throw error if chainKey is not provided', async () => {
      try {
        await uut.start()
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'chainKey must be provided when start EVM!')
      }
    })
    it('should throw error if network data is not found', async () => {
      try {
        await uut.start('unknow')
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'Network data not found for chainKey')
      }
    })
  })
  describe('#verifyConnection', () => {
    it('should verify connection', async () => {
      sandbox.stub(uut.web3.eth, 'getBlock').resolves({
        number: 1234567890
      })
      const res = await uut.verifyConnection()
      assert.isTrue(res)
    })
    it('should throw error if connection is not verified', async () => {
      sandbox.stub(uut.web3.eth, 'getBlock').rejects(new Error('Connection failed'))
      try {
        await uut.verifyConnection()
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'Connection failed')
      }
    })
  })
  describe('#createHDWallet', () => {
    it('should create hd wallet', async () => {
      const testMnemonic = uut.bip39.generateMnemonic()
      const res = await uut.createHDWallet(testMnemonic)
      assert.isObject(res)
      assert.hasAllKeys(res, ['address', 'privateKey', 'publicKey', 'hdIndex', 'mnemonic'])
    })
    it('should throw error if mnemonic is not provided', async () => {
      try {
        await uut.createHDWallet()
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'mnemonic must be provided when create a new hd wallet')
      }
    })
    it('should handle  hdIndex if provided', async () => {
      const testMnemonic = uut.bip39.generateMnemonic()
      const res = await uut.createHDWallet(testMnemonic, 5)
      assert.isObject(res)
      assert.hasAllKeys(res, ['address', 'privateKey', 'publicKey', 'hdIndex', 'mnemonic'])
      assert.equal(res.hdIndex, 5)
    })
  })
  describe('#createWallet', () => {
    it('should create wallet', async () => {
      const testMnemonic = uut.bip39.generateMnemonic()
      const res = await uut.createWallet(testMnemonic)
      assert.isObject(res)
      assert.hasAllKeys(res, ['address', 'privateKey', 'publicKey', 'hdIndex', 'mnemonic'])
    })
    it('should create mnemonic wallet if mnemonic is not provided', async () => {
      const res = await uut.createWallet()
      assert.isObject(res)
      assert.hasAllKeys(res, ['address', 'privateKey', 'publicKey', 'hdIndex', 'mnemonic'])
    })
    it('should handle error', async () => {
      sandbox.stub(uut.bip39, 'mnemonicToSeed').throws(new Error('Error on createWallet'))
      try {
        await uut.createWallet()
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'Error on createWallet')
      }
    })
  })
  describe('#getBalance', () => {
    it('should get balance', async () => {
      sandbox.stub(uut.web3.eth, 'getBalance').resolves(1000000000000000000)
      const res = await uut.getBalance('0x0000000000000000000000000000000000000000')
      assert.isObject(res)
      assert.property(res, 'big')
      assert.property(res, 'number')
    })
    it('should throw error if address is not provided', async () => {
      try {
        await uut.getBalance()
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'Address must be provided when getting balance')
      }
    })
  })

  describe('#send', () => {
    it('should send', async () => {
      sandbox.stub(uut.web3.eth.accounts.wallet, 'add').callsFake(() => { return [{ address: 'address' }] })
      sandbox.stub(uut.feeLib, 'getFee').resolves({
        fee: 0.001,
        gasLimit: 21000n,
        gasPrice: 1000000000000000000n
      })
      sandbox.stub(uut.web3.eth, 'sendTransaction').resolves({
        transactionHash: '0x1234567890abcdef'
      })
      const tx = await uut.send('0x0000000000000000000000000000000000000000', 100000000000000n, 'privateKey')
      assert.isString(tx)
    })
    it('should throw error if address is not provided', async () => {
      try {
        await uut.send()
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'Address must be provided when sending')
      }
    })
    it('should throw error if value is not provided', async () => {
      try {
        await uut.send('0x0000000000000000000000000000000000000000')
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'Value must be provided when sending')
      }
    })
    it('should throw error if private key is not provided', async () => {
      try {
        await uut.send('0x0000000000000000000000000000000000000000', 100000000000000n)
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'Private key must be provided when sending')
      }
    })
  })
  describe('#toNum', () => {
    it('should convert BigInt to number', () => {
      const res = uut.toNum(1234567890n)
      assert.equal(typeof res, 'number')
    })
    it('should handle error if value is not a BigInt', () => {
      try {
        uut.toNum('not a BigInt')
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'Value must be a BigInt when converting to number')
      }
    })
  })
  describe('#toBig', () => {
    it('should convert number to BigInt', () => {
      const res = uut.toBig(1234567890)
      assert.equal(typeof res, 'bigint')
    })
    it('should handle error if value is not a BigInt', () => {
      try {
        uut.toBig('not a number')
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'Value must be a number when converting to BigInt')
      }
    })
  })
  describe('#toUSD', async () => {
    it('should convert number to USD', async () => {
      uut.networkData = {
        symbol: 'ETH'
      }
      sandbox.stub(uut.rate, 'getUSDPrice').resolves(0.2)
      const res = await uut.toUSD(1234567890)
      assert.isString(res)
    })
    it('should handle error ', async () => {
      try {
        uut.networkData = {
          symbol: 'ETH'
        }
        sandbox.stub(uut.rate, 'getUSDPrice').throws(new Error('Error on getUSDPrice'))

        await uut.toUSD(123156n)
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'Error on getUSDPrice')
      }
    })
  })
  describe('#fromUSD', async () => {
    it('should conver USD to bigint', async () => {
      uut.networkData = {
        symbol: 'ETH'
      }
      sandbox.stub(uut.rate, 'getUSDPrice').resolves(0.2)
      const res = await uut.fromUSD(5)
      assert.isString(res)
    })
    it('should handle error ', async () => {
      try {
        uut.networkData = {
          symbol: 'ETH'
        }
        sandbox.stub(uut.rate, 'getUSDPrice').throws(new Error('Error on getUSDPrice'))

        await uut.fromUSD(5)
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'Error on getUSDPrice')
      }
    })
  })
})
