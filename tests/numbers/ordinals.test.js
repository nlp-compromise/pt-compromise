import test from 'tape'
import nlp from '../_lib.js'
let here = '[ordinal-parse] '

let genders = [
  ['primeiro', 'primeira', '1st'],
  ['segundo', 'segunda', '2nd'],
  ['terceiro', 'terceira', '3rd'],
  ['quarto', 'quarta', '4th'],
  ['quinto', 'quinta', '5th'],
  ['sexto', 'sexta', '6th'],
  ['sétimo', 'sétima', '7th'],
  ['oitavo', 'oitava', '8th'],
  ['nono', 'nona', '9th'],
  ['décimo', 'décima', '10th'],
  ['décimo-primeiro', 'décima-primeira', '11th'],
  ['décimo-segundo', 'décima-segunda', '12th'],
  ['vigésimo', 'vigésima', '20th'],
  ['vigésimo-primeiro', 'vigésima-primeira', '21st'],
  ['vigésimo-segundo', 'vigésima-segundo', '22nd'],
  ['trigésimo', 'trigésima', '30th'],
  ['quadragésimo', 'quadragésima', '40th'],
  ['quinquagésimo', 'quinquagésima', '50th'],
  ['sexagésimo', 'sexagésima', '60th'],
  ['septuagésimo', 'septuagésima', '70th'],
  ['octogésimo', 'octogésima', '80th'],
  ['nonagésimo', 'nonagésima', '90th'],
  ['centésimo', 'centésima', '100th'],
  ['décimo primeiro', 'décimo primeira', '11th'],
  ['trigésimo quarto', 'trigésima quarto', '34th'],
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
  ['quingentésimo', 'quingentésimos'],
  ['qüingentésimo', 'qüingentésimos'],
  ['sexcentésimo', 'sexcentésimos'],
  ['setingentésimo', 'setingentésimos'],
  ['octingentésimo', 'octingentésimos'],
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
    let [m, f, en] = a
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

// test('number-parse:', function (t) {
//   arr.forEach(a => {
//     let [want, str] = a
//     let doc = nlp(str)
//     let n = doc.numbers().get()[0]
//     t.equal(n, want, here + '[toNumber] ' + str)
//   })
//   t.end()
// })

// test('number-create:', function (t) {
//   arr.forEach(a => {
//     let [num, str] = a
//     let doc = nlp(String(num))
//     doc.numbers().toText()
//     t.equal(doc.text(), str, here + '[toText] ' + num)
//   })
//   t.end()
// })
