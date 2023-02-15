import test from 'tape'
import nlp from '../_lib.js'
let here = '[ordinal-parse] '

let genders = [
  ['primeiro', 'primeira', 1],
  ['segundo', 'segunda', 2],
  ['terceiro', 'terceira', 3],
  ['quarto', 'quarta', 4],
  ['quinto', 'quinta', 5],
  ['sexto', 'sexta', 6],
  ['sétimo', 'sétima', 7],
  ['oitavo', 'oitava', 8],
  ['nono', 'nona', 9],
  ['décimo', 'décima', 10],
  ['décimo-primeiro', 'décima-primeira', 11],
  ['décimo-segundo', 'décima-segunda', 12],
  ['vigésimo', 'vigésima', 20],
  ['vigésimo-primeiro', 'vigésima-primeira', 21],
  ['vigésimo-segundo', 'vigésima-segundo', 22],
  ['trigésimo', 'trigésima', 30],
  ['quadragésimo', 'quadragésima', 40],
  ['quinquagésimo', 'quinquagésima', 50],
  ['sexagésimo', 'sexagésima', 60],
  ['septuagésimo', 'septuagésima', 70],
  ['octogésimo', 'octogésima', 80],
  ['nonagésimo', 'nonagésima', 90],
  ['centésimo', 'centésima', 100],
  ['décimo primeiro', 'décimo primeira', 11],
  ['trigésimo quarto', 'trigésima quarto', 34],
]

let plurals = [
  // masc forms
  ['primeiro', 'primeiros'],
  ['segundo', 'segundos'],
  ['terceiro', 'terceiros'],
  ['quarto', 'quartos'],
  ['quinto', 'quintos'],
  ['sexto', 'sextos'],
  ['sétimo', 'sétimos'],
  ['oitavo', 'oitavos'],
  ['nono', 'nonos'],
  ['décimo', 'décimos'],
  ['décimo primeiro', 'décimos primeiros'],
  ['décimo segundo', 'décimos segundos'],
  ['décimo terceiro', 'décimos terceiros'],
  ['vigésimo', 'vigésimos'],
  ['vigésimo primeiro', 'vigésimos primeiros'],
  ['trigésimo', 'trigésimos'],
  ['quadragésimo', 'quadragésimos'],
  ['quinquagésimo', 'quinquagésimos'],
  ['qüinquagésimo', 'qüinquagésimos'],
  ['sexagésimo', 'sexagésimos'],
  ['septuagésimo', 'septuagésimos'],
  ['octogésimo', 'octogésimos'],
  ['nonagésimo', 'nonagésimos'],
  ['centésimo', 'centésimos'],
  ['ducentésimo', 'ducentésimos'],
  ['trecentésimo', 'trecentésimos'],
  ['quadringentésimo', 'quadringentésimos'],
  // ['quingentésimo', 'quingentésimos'],
  // ['qüingentésimo', 'qüingentésimos'],
  ['sexcentésimo', 'sexcentésimos'],
  ['setingentésimo', 'setingentésimos'],
  // ['octingentésimo', 'octingentésimos'],
  ['nongentésimo', 'nongentésimos'],
  ['milésimo', 'milésimos'],
  // fem forms
  ['primeira', 'primeiras'],
  ['segunda', 'segundas'],
  ['terceira', 'terceiras'],
  ['quarta', 'quartas'],
  ['quinta', 'quintas'],
  ['sexta', 'sextas'],
  ['sétima', 'sétimas'],
  ['oitava', 'oitavas'],
  ['nona', 'nonas'],
  ['décima', 'décimas'],
  ['décima primeira', 'décimas primeiras'],
  ['décima segunda', 'décimas segundas'],
  ['décima terceira', 'décimas terceiras'],
  ['vigésima', 'vigésimas'],
  ['vigésima primeira', 'vigésimas primeiras'],
  ['trigésima', 'trigésimas'],
  ['quadragésima', 'quadragésimas'],
  ['qüinquagésima', 'qüinquagésimas'],
  ['sexagésima', 'sexagésimas'],
  ['septuagésima', 'septuagésimas'],
  ['octogésima', 'octogésimas'],
  ['nonagésima', 'nonagésimas'],
  ['centésima', 'centésimas'],
  ['ducentésima', 'ducentésimas'],
  ['trecentésima', 'trecentésimas'],
  ['quadringentésima', 'quadringentésimas'],
  ['qüingentésima', 'qüingentésimas'],
  ['sexcentésima', 'sexcentésimas'],
  ['setingentésima', 'setingentésimas'],
  ['octingentésima', 'octingentésimas'],
  ['nongentésima', 'nongentésimas'],
  ['milésima', 'milésimas'],
]
test('number-tag:', function (t) {
  genders.forEach(a => {
    let [m, f] = a
    t.equal(nlp(m).has('^#Ordinal+$'), true, here + 'tag ' + m)
    t.equal(nlp(f).has('^#Ordinal+$'), true, here + 'tag ' + f)
  })
  plurals.forEach(a => {
    let [s, p] = a
    t.equal(nlp(s).has('^#Ordinal+$'), true, here + 'tag ' + s)
    t.equal(nlp(p).has('^#Ordinal+$'), true, here + 'tag ' + p)
  })
  t.end()
})

test('number-parse:', function (t) {
  genders.forEach(a => {
    let [m, f, n] = a
    let num = nlp(m).numbers().get()[0]
    t.equal(num, n, here + '[toNumber] ' + m)
    num = nlp(f).numbers().get()[0]
    t.equal(num, n, here + '[toNumber] ' + f)
  })
  plurals.forEach(a => {
    let [s, p] = a
    let left = nlp(s).numbers().get()[0]
    let right = nlp(p).numbers().get()[0]
    t.equal(left, right, here + `${left} == ${right}`)
  })
  t.end()
})

// test('number-create:', function (t) {
//   arr.forEach(a => {
//     let [num, str] = a
//     let doc = nlp(String(num))
//     doc.numbers().toText()
//     t.equal(doc.text(), str, here + '[toText] ' + num)
//   })
//   t.end()
// })
