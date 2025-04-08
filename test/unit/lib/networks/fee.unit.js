import { assert } from 'chai'
import sinon from 'sinon'

import FeeLib from '../../../../src/lib/networks/fee.js'
import { cleanDb, startDb } from '../../../util/test-util.js'

describe('#Fee', () => {
  let uut
  let sandbox

  before(async () => {
    uut = new FeeLib({})

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

  describe('#getFee', () => {
    it('should get eth fee', async () => {
      sandbox.stub(uut, 'getEVMFee').resolves({
        fee: 1000,
        gasLimit: 1000,
        gasPrice: 1000
      })
      uut.chain = 'eth'
      const res = await uut.getFee()
      assert.isObject(res)
      assert.hasAllKeys(res, ['fee', 'gasLimit', 'gasPrice'])
    })
    it('should get avax fee', async () => {
      sandbox.stub(uut, 'getEVMFee').resolves({
        fee: 1000,
        gasLimit: 1000,
        gasPrice: 1000
      })
      uut.chain = 'avax'
      const res = await uut.getFee()
      assert.isObject(res)
      assert.hasAllKeys(res, ['fee', 'gasLimit', 'gasPrice'])
    })
    it('should get trx fee', async () => {
      sandbox.stub(uut, 'getTronFee').resolves({
        fee: 1000,
        bandwidthConsumption: 1000,
        requiredBandwidth: 1000,
        currentBandwidth: 1000,
        from: '0x1234567890',
        bandwidthPrice: 1000
      })
      uut.chain = 'trx'
      const res = await uut.getFee()
      assert.isObject(res)
      assert.hasAllKeys(res, ['fee', 'bandwidthConsumption', 'requiredBandwidth', 'currentBandwidth', 'from', 'bandwidthPrice'])
    })
    it('should return false if chainKey is not known', async () => {
      uut.chain = 'unknown'
      const res = await uut.getFee()
      assert.isFalse(res)
    })
  })
  describe('#getEVMFee', () => {
    it('should get evm fee', async () => {
      uut.provider = {
        getBlock: () => {
          return {
            baseFeePerGas: 1000n
          }
        }
      }

      const res = await uut.getEVMFee()
      assert.isObject(res)
      assert.hasAllKeys(res, ['fee', 'gasLimit', 'gasPrice'])
    })
    it('should handle  error', async () => {
      try {
        uut.provider = {
          getBlock: () => {
            return {
              baseFeePerGas: 1000n
            }
          }
        }
        sandbox.stub(uut.provider, 'getBlock').throws(new Error('test error'))
        await uut.getEVMFee()
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'test error')
      }
    })
  })
  describe('#getTronFee', () => {
    it('should get fee', async () => {
      uut.provider = {
        trx: {
          getBandwidth: () => {
            return 1000
          },
          getBandwidthPrices: () => {
            return '1000'
          }
        },
        address: {
          fromPrivateKey: () => {
            return '0x1234567890'
          }
        },
        transactionBuilder: {
          sendTrx: () => {
            return {
              raw_data_hex: '0x1234567890'
            }
          }
        }
      }
      const res = await uut.getTronFee()
      assert.isObject(res)
      assert.hasAllKeys(res, ['fee', 'bandwidthConsumption', 'requiredBandwidth', 'currentBandwidth', 'from', 'bandwidthPrice'])
    })
    it('should handle  error', async () => {
      try {
        uut.provider = {
          trx: {
            getBandwidth: () => {
              return 1000
            },
            getBandwidthPrices: () => {
              return '1000'
            }
          },
          address: {
            fromPrivateKey: () => {
              return '0x1234567890'
            }
          },
          transactionBuilder: {
            sendTrx: () => {
              return {
                raw_data_hex: '0x1234567890'
              }
            }
          }
        }
        sandbox.stub(uut.provider.trx, 'getBandwidth').throws(new Error('test error'))
        await uut.getTronFee()
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'test error')
      }
    })
  })
})
