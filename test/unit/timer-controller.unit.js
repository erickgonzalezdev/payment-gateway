import { assert } from 'chai'
import sinon from 'sinon'

import TimerController from '../../src/timer-controller.js'
import Libraries from '../../src/lib/index.js'
import UseCases from '../../src/use-cases/index.js'
import { cleanDb, startDb } from '../util/test-util.js'
import config from '../../config.js'
describe('#TimerController', () => {
  let uut
  let sandbox

  before(async () => {
    const libraries = new Libraries(config)

    const useCases = new UseCases({ libraries })

    uut = new TimerController({ useCases })

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
    it('should throw error if useCases is not provided', async () => {
      try {
        uut = new TimerController()
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'Instance of Use Cases library required when instantiating Timer Controller libraries.')
      }
    })
  })
  describe('#startTimers', () => {
    it('should start timers', async () => {
      const res = uut.startTimers()
      assert.isTrue(res)
    })
  })
})
