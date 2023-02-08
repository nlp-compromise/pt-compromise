import { chromium } from 'playwright'
import fs from 'fs'
// import words from '/Users/spencer/mountain/pt-compromise/data/lexicon/verbs/infinitive.js'

let words = [
  'pôr',
  'dançar',
  'começar',
  'almoçar',
  'alcançar',
  'abraçar',
  'lançar',
  'caçar',
  'abençoar',
  'avançar',
  'traçar',
  'coçar',
  'disfarçar',
  'esforçar',
  'balançar',
  'calçar',
  'forçar',
  'desperdiçar',
  'ameaçar',
  'debruçar',
  'aperfeiçoar',
  'reforçar',
  'tropeçar',
  'bagunçar',
  'recomeçar',
  'preguiçar',
  'rechaçar',
  'fuçar',
  'endereçar',
  'caçoar',
  'troçar',
  'orçar',
  'esperançar',
  'cobiçar',
  'amaldiçoar',
  'atiçar',
  'despedaçar',
  'alçar',
  'adoçar',
  'roçar',
  'aguçar',
  'realçar',
  'soluçar',
  'içar',
  'trançar',
  'esvoaçar',
  'almorçar',
  'foiçar',
  'esboçar',
  'terçar',
  'esmiuçar',
  'descalçar',
  'laçar',
  'afeiçoar',
  'embaçar',
  'espicaçar',
  'açoitar',
  'espreguiçar',
  'entrelaçar',
  'maçonizar',
  'alicerçar',
  'acaçapar',
  'empeçar',
  'embaraçar',
  'maçar',
  'arregaçar',
  'enfeitiçar',
  'açodar',
  'escorraçar',
  'justiçar',
  'desembaraçar',
  'apreçar',
  'enlaçar',
  'destroçar',
  'amordaçar',
  'atraiçoar',
  'enguiçar',
  'desgraçar',
  'espaçar',
  'estraçalhar',
  'alvoroçar',
  'diferençar',
  'ouriçar',
  'relançar',
  'inçar',
  'fumaçar',
  'encabeçar',
  'engraçar',
  'eriçar',
  'viçar',
  'riçar',
  'estilhaçar',
  'avençar',
  'remoçar',
  'imperfeiçoar',
  'raçoar',
  'desembaçar',
  'esperdiçar',
  'afiançar',
  'descabeçar',
  'espedaçar',
  'soçobrar',
  'açular',
  'destrinçar',
  'achoçar',
  'parçar',
  'açucarar',
  'pré-lavar',
  'morraçar',
  'perfeiçoar',
  'regaçar',
  'panaçar',
  'congraçar',
  'adelgaçar',
  'contrabalançar',
  'açambarcar',
  'esbagaçar',
  'esgarçar',
  'trouçar',
  'esfumaçar',
  'empoçar',
  'abalançar',
  'desesperançar',
  'baloiçar',
  'adereçar',
  'rebuçar',
  'mestiçar',
  'abendiçoar',
  'entrançar',
  'maldiçoar'
]

const doit = async function (page, word) {
  let safer = word.replace(/ç/, 'c')
  safer = safer.replace(/ô/, 'o')
  let url = `https://www.conju` + '' + `gacao.co${''}m.br/verbo-${safer}/`
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