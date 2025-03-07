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

    if (!this.url1) throw new Error('Rate class cant be instantiate , rate url must be provided!')

    this.getUSDPrice = this.getUSDPrice.bind(this)
  }

  async getUSDPrice (key) {
    try {
      // Launch the browser and open a new blank page
      const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
      const page = await browser.newPage()
      const url = this.url1

      await page.goto(url, { waitUntil: 'load', timeout: 30000 })

      /*       // Set screen size
      const img = await page.screenshot()
      console.log(img)
      const _path = path.resolve('./test.jpeg')
      fs.writeFileSync(_path, img)
 */
      const tableData = await page.$$eval('table tr td', (tds) =>
        tds.map((td) => {
          return td.innerText
        })
      )

      const index = tableData.findIndex((val) => { return val === key.toUpperCase() })
      const valueStr = tableData[index + 2]
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
