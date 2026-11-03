import { chromium } from 'playwright'
import fs from 'node:fs'
import words from '/Users/spencer/mountain/pt-compromise/data/lexicon/verbs/infinitive.js'

// let words = [
//   'maldiçoar'
// ]

const doit = async function (page, word) {
  let safer = word.replace(/ç/, 'c')
  safer = safer.replace(/ô/, 'o')
  const url = `https://www.conju` + '' + `gacao.co${''}m.br/verbo-${safer}/`
  await page.goto(url)
  await page.waitForTimeout(1500) // wait for 1 seconds
  const data = { word, arr: [] }
  const table = await page.locator('.info-v')
  const types = await table.locator('.f')
  const count = await types.count()
  for (let i = 0; i < count; ++i) {
    if (i >= 2) {
      break
    }
    const w = await types.nth(i).textContent()
    data.arr.push(w)
  }
  console.log(data)
  const str = '\n' + JSON.stringify(data) + ',\n'
  fs.writeFileSync('./results.txt', str, { flag: 'a' })

  return data
}

const doAll = async function () {
  const browser = await chromium.launch({
    headless: false // Show the browser. 
  })
  const page = await browser.newPage()

  for (let i = 0; i < words.length; i += 1) {
    const meta = await doit(page, words[i])
    console.log(meta)
  }
  await browser.close()
}
doAll()