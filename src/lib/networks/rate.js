/**
 * Puppeter handler.
 * On Vps is recommended to install chrome  before use puppeter.
 *
 */
import puppeteer from 'puppeteer'

class Rate {
  constructor (config = {}) {
    this.config = config
    this.url1 = config.rateURL1
    this.puppeteer = puppeteer

    if (!this.url1) throw new Error('Rate class cant be instantiate , rate url must be provided!')

    this.getUSDPrice = this.getUSDPrice.bind(this)
    this.sleep = this.sleep.bind(this)
  }

  async sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async getUSDPrice (key) {
    try {
      if (!key) throw new Error('chain key must be provided')
      // Launch the browser and open a new blank page
      const browser = await this.puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
      const page = await browser.newPage()
      const url = this.url1

      await page.goto(url, { waitUntil: 'load', timeout: 30000 })
      await page.waitForSelector('table tr td div:last-child', { timeout: 5000 })
      await page.evaluate(async () => {
        const scrollContainer = document.querySelector('div.scroll-wrapper') || document.scrollingElement
        for (let i = 0; i < 10; i++) {
          scrollContainer.scrollBy(0, 500)
          await this.sleep(500) // wait 500ms between scrolls
        }
      })

      /*       // Set screen size
      const img = await page.screenshot()
      console.log(img)
      const _path = path.resolve('./test.jpeg')
      fs.writeFileSync(_path, img)
 */
      const tableData = await page.$$eval('table tr td div', (tds) =>
        tds.map((td) => {
          return td.innerText
        })
      )

      const index = tableData.findIndex((val) => { return val === key.toUpperCase() })
      console.log('index', index)
      const valueStr = tableData[index + 1]
      console.log('valueStr', valueStr)
      const cleanValueStr = valueStr.replace('$', '').replace(',', '')
      const value = Number(cleanValueStr)
      if (!value || isNaN(value)) throw new Error(`Value cant be handled ${value}`)
      return value
    } catch (error) {
      console.log('error', error)
      throw error
    }
  }
}
export default Rate
