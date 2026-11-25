import test from 'tape'
import nlp from '../../_lib.js'
const here = '[number-chain] '
nlp.verbose(false)

test('chained number changes:', function (t) {
  let doc = nlp('tenho cinco gatos pretos')
  t.deepEqual(doc.numbers().add(2).get(), [7], here + 'add get')
  t.equal(doc.text(), 'tenho sete gatos pretos', here + 'add text')

  doc = nlp('tenho cinco gatos pretos')
  t.deepEqual(doc.numbers().add(2).add(1).get(), [8], here + 'add add')
  t.equal(doc.text(), 'tenho oito gatos pretos', here + 'add add text')

  doc = nlp('tenho cinco gatos pretos')
  t.deepEqual(doc.numbers().set(10).get(), [10], here + 'set get')
  t.deepEqual(doc.numbers().increment().get(), [11], here + 'increment get')
  t.deepEqual(doc.numbers().decrement().subtract(3).get(), [7], here + 'decrement subtract')
  t.equal(doc.text(), 'tenho sete gatos pretos', here + 'set text')

  doc = nlp('tenho cinco gatos pretos')
  t.deepEqual(doc.numbers().toNumber().toText().get(), [5], here + 'toNumber toText')
  t.equal(doc.text(), 'tenho cinco gatos pretos', here + 'toNumber toText text')
  t.deepEqual(doc.numbers().toText().toNumber().get(), [5], here + 'toText toNumber')
  t.equal(doc.text(), 'tenho 5 gatos pretos', here + 'toText toNumber text')

  doc = nlp('dezessete gatos')
  t.deepEqual(doc.numbers().toOrdinal().get(), [17], here + 'toOrdinal get')
  t.equal(doc.text(), 'décimo sétimo gatos', here + 'toOrdinal text')
  t.deepEqual(doc.numbers().toCardinal().get(), [17], here + 'toCardinal get')
  t.equal(doc.text(), 'dezessete gatos', here + 'toCardinal text')
  t.end()
})

// a second change, on a view that was made before the first one
test('number view follows its changes:', function (t) {
  let doc = nlp('tenho cinco gatos pretos')
  let m = doc.numbers()
  m.set(31)
  t.equal(doc.text(), 'tenho trinta e um gatos pretos', here + 'longer')
  t.deepEqual(m.get(), [31], here + 'longer get')
  t.equal(m.text(), 'trinta e um', here + 'longer view')
  m.add(69)
  t.equal(doc.text(), 'tenho cem gatos pretos', here + 'shorter')
  t.deepEqual(m.get(), [100], here + 'shorter get')
  m.toNumber()
  t.equal(doc.text(), 'tenho 100 gatos pretos', here + 'numeric')
  m.increment()
  t.equal(doc.text(), 'tenho 101 gatos pretos', here + 'numeric increment')
  m.toText()
  t.equal(doc.text(), 'tenho cento e um gatos pretos', here + 'text again')
  t.deepEqual(m.get(), [101], here + 'text again get')
  t.equal(m.length, 1, here + 'still one number')

  // two numbers in one sentence
  doc = nlp('noventa e nove balões e três gatos')
  m = doc.numbers()
  t.deepEqual(m.add(1).get(), [100, 4], here + 'two add')
  t.deepEqual(m.get(), [100, 4], here + 'two original view')
  t.equal(doc.text(), 'cem balões e quatro gatos', here + 'two text')
  t.deepEqual(m.add(21).get(), [121, 25], here + 'two add again')
  t.equal(doc.text(), 'cento e vinte e um balões e vinte e cinco gatos', here + 'two text again')
  t.deepEqual(m.toNumber().get(), [121, 25], here + 'two toNumber')
  t.equal(doc.text(), '121 balões e 25 gatos', here + 'two numeric text')
  t.equal(m.length, 2, here + 'still two numbers')
  t.end()
})

// the new words are found as a number again
test('changed number is re-tagged:', function (t) {
  const bad = []
  for (let n = 0; n <= 130; n += 1) {
    const doc = nlp('tenho cinco gatos')
    doc.numbers().set(n)
    if (doc.numbers().get()[0] !== n || doc.numbers().length !== 1) {
      bad.push(n)
    }
  }
  t.deepEqual(bad, [], here + 'set 0-130, before a noun')
  const doc = nlp('tenho cinco gatos')
  doc.numbers().set(31)
  t.equal(doc.match('#Value+').text(), 'trinta e um', here + 'e um is a value')
  doc.numbers().toOrdinal()
  t.equal(doc.text(), 'tenho trigésimo primeiro gatos', here + 'ordinal text')
  t.equal(doc.match('#Ordinal+').text(), 'trigésimo primeiro', here + 'both words are ordinal')
  t.deepEqual(doc.numbers().get(), [31], here + 'ordinal get')
  // other tags are kept
  const money = nlp('cinco euros')
  money.numbers().add(2)
  t.equal(money.text(), 'sete euros', here + 'money text')
  t.equal(money.has('#Money'), true, here + 'money tag is kept')
  t.end()
})

test('punctuation is kept:', function (t) {
  const arr = [
    ['um, dois e três.', '1, 2 e 3.'],
    ['sete? oito!', '7? 8!'],
    ['"seis" ou (-5)', '"6" ou (-5)'],
    ['Cinco gatos', '5 gatos'],
  ]
  arr.forEach(a => {
    const doc = nlp(a[0])
    doc.numbers().toNumber()
    t.equal(doc.text(), a[1], here + a[0])
  })
  const doc = nlp('1, 2 e 3. Tenho 7?')
  doc.numbers().toText()
  t.equal(doc.text(), 'um, dois e três. Tenho sete?', here + 'toText')
  t.end()
})
