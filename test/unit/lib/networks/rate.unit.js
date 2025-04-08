import { assert } from 'chai'
import sinon from 'sinon'

import RateLib from '../../../../src/lib/networks/rate.js'
import { cleanDb, startDb } from '../../../util/test-util.js'

describe('#Rate', () => {
  let uut
  let sandbox

  before(async () => {
    uut = new RateLib({ rateURL1: 'https://www.fakeurl.com' })

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
  describe('#constructor', () => {
    it('should throw an error if rateURL1 is not provided', () => {
      try {
        const uut = new RateLib()
        console.log(uut)
        assert.fail('should throw an error if rateURL1 is not provided')
      } catch (error) {
        assert.equal(error.message, 'Rate class cant be instantiate , rate url must be provided!')
      }
    })
  })
  describe('#getUSDPrice', () => {
    it('should get rate  of provided chain key', async () => {
      const mockPage = [
        'BTC',
        '$',
        '2800',
        'USD',
        'AVAX',
        '$',
        '1000',
        'USD',
        'SOL',
        '$',
        '125',
        'USD'
      ]
      sandbox.stub(uut.puppeteer, 'launch').resolves({
        newPage: () => {
          return {
            goto: () => Promise.resolve(),
            $$eval: () => { return mockPage }
          }
        }
      })
      const res = await uut.getUSDPrice('avax')
      assert.equal(res, 1000)
    })
    it('should handle error', async () => {
      try {
        await uut.getUSDPrice()
        assert.fail('should throw an error if chain key is not provided')
      } catch (error) {
        assert.equal(error.message, 'chain key must be provided')
      }
    })
  })
})
