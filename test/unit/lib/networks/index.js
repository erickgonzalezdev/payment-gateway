import { assert } from 'chai'
import sinon from 'sinon'

import NetworksLib from '../../../../src/lib/networks/index.js'
import { cleanDb, startDb } from '../../../util/test-util.js'

describe('#NetworksLib', () => {
  let uut
  let sandbox

  before(async () => {
    uut = new NetworksLib({ rateURL1: 'https://www.fakeurl.com' })

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
    it('should start all networks', async () => {
      sandbox.stub(uut.eth, 'start').resolves()
      sandbox.stub(uut.avax, 'start').resolves()
      sandbox.stub(uut.trx, 'start').resolves()
      const res = await uut.start()
      assert.isTrue(res)
    })
    it('should handle error', async () => {
      sandbox.stub(uut.eth, 'start').rejects(new Error('Error starting eth'))
      try {
        await uut.start()
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'Error starting eth')
      }
    })
  })
  describe('#createMultiHDWallets', () => {
    it('should create multi hd wallets', async () => {
      sandbox.stub(uut.eth, 'createHDWallet').resolves()
      sandbox.stub(uut.avax, 'createHDWallet').resolves()
      sandbox.stub(uut.trx, 'createHDWallet').resolves()
      const res = await uut.createMultiHDWallets()
      assert.isObject(res)
      assert.hasAllKeys(res, ['eth', 'avax', 'trx'])
    })
    it('should handle error', async () => {
      try {
        sandbox.stub(uut.eth, 'createHDWallet').throws(new Error('Error creating eth hd wallet'))
        await uut.createMultiHDWallets()
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'Error creating eth hd wallet')
      }
    })
  })
  describe('#decodeHex', () => {
    it('should decode hex', async () => {
      const str = 'a hex string'
      const hex = Buffer.from(str, 'utf8').toString('hex')
      const res = await uut.decodeHex(hex)
      assert.equal(res, 'a hex string')
    })
    it('should handle error', async () => {
      try {
        await uut.decodeHex()
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'The first argument must be')
      }
    })
  })
  describe('#getNewMnemonic', () => {
    it('should get new mnemonic', async () => {
      const res = await uut.getNewMnemonic()
      assert.isString(res)
    })
    it('should handle error', async () => {
      try {
        sandbox.stub(uut.bip39, 'generateMnemonic').rejects(new Error('Error generating mnemonic'))
        await uut.getNewMnemonic()
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'Error generating mnemonic')
      }
    })
  })
})
