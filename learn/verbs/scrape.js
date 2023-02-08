import { chromium } from 'playwright'
import fs from 'fs'
import words from '/Users/spencer/mountain/pt-compromise/data/lexicon/verbs/infinitive.js'

// let words = [
//   'estar',
//   'existir',
//   // 'fortalecer'
// ]

const doit = async function (page, word) {
  let url = `https://www.conju` + '' + `gacao.co${''}m.br/verbo-${word}/`
  await page.goto(url)
  await page.waitForTimeout(1500) // wait for 1 seconds
  let data = { word }
  let table = await page.locator('#conjugacao')
  let types = await table.locator('.tempo-conjugacao')
  const count = await types.count()
  for (let i = 0; i < count; ++i) {
    let row = await types.nth(i)
    let type = await row.locator('h4').textContent()
    data[type] = []

    let kinds = await row.locator('.f')
    const allKinds = await kinds.count()
    for (let k = 0; k < allKinds; k += 1) {
      let res = await kinds.nth(k).textContent()
      data[type].push(res)
    }
  }
  console.log(data)
  let str = '\n' + JSON.stringify(data) + ',\n'
  fs.writeFileSync('./results.txt', str, { flag: 'a' })

  return data
}

const doAll = async function () {
  const browser = await chromium.launch({
    headless: false // Show the browser. 
  })
  const page = await browser.newPage()

  for (let i = 0; i < words.length; i += 1) {
    let meta = await doit(page, words[i])
    console.log(meta)
  }
  await browser.close()
}
doAll()