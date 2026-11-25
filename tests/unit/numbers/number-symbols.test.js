import test from 'tape'
import nlp from '../../_lib.js'
const here = '[number-symbols] '
nlp.verbose(false)

const run = function (str, fn) {
  const doc = nlp(str)
  fn(doc.numbers())
  return doc.text()
}

// a symbol is never left stuck to a word - 'cinquenta%'
test('percent toText:', function (t) {
  const doc = nlp('50%')
  doc.numbers().toText()
  t.equal(doc.text(), 'cinquenta por cento', here + '50% toText')
  t.deepEqual(doc.numbers().get(), [50], here + 'value')
  t.equal(doc.numbers().length, 1, here + 'one number')
  t.equal(doc.has('#Percent'), true, here + 'percent')
  t.deepEqual(doc.numbers().units().out('array'), ['por cento'], here + 'unit')
  // and back - with a space before the symbol
  doc.numbers().toNumber()
  t.equal(doc.text(), '50 %', here + 'toNumber')
  t.deepEqual(doc.numbers().get(), [50], here + 'value, again')
  t.equal(doc.has('#Percent'), true, here + 'percent, again')
  t.deepEqual(doc.numbers().units().out('array'), ['%'], here + 'unit, again')
  doc.numbers().toText()
  t.equal(doc.text(), 'cinquenta por cento', here + '50 % toText')
  t.end()
})

test('por cento:', function (t) {
  const arr = [
    ['cinquenta por cento', 50],
    ['vinte e cinco por cento das pessoas', 25],
    ['cem por cento', 100],
    ['um por cento', 1],
    ['50 por cento', 50],
    ['50 %', 50],
    ['12,5 %', 12.5],
    ['50%', 50],
  ]
  arr.forEach(a => {
    const m = nlp(a[0]).numbers()
    t.equal(m.length, 1, here + 'one number: ' + a[0])
    t.equal(m.get()[0], a[1], here + 'value: ' + a[0])
    t.equal(m.has('#Percent'), true, here + 'percent: ' + a[0])
  })
  // every word of the number
  t.equal(nlp('vinte e cinco por cento').match('#Percent+').text(), 'vinte e cinco', here + 'whole number is percent')
  t.equal(nlp('trabalha por cem euros').has('#Percent'), false, here + 'por cem euros')
  t.end()
})

test('symbol toText:', function (t) {
  const arr = [
    ['50%', 'cinquenta por cento', 50],
    ['50 %', 'cinquenta por cento', 50],
    ['1%', 'um por cento', 1],
    ['100%', 'cem por cento', 100],
    ['tem um desconto de 50% hoje', 'tem um desconto de cinquenta por cento hoje', 50],
    ['desceu -5% ontem', 'desceu menos cinco por cento ontem', -5],
    // money
    ['5€', 'cinco euros', 5],
    ['€5', 'cinco euros', 5],
    ['5 €', 'cinco euros', 5],
    ['5 euros', 'cinco euros', 5],
    ['1€', 'um euro', 1],
    ['€1', 'um euro', 1],
    ['1 euro', 'um euro', 1],
    ['21€', 'vinte e um euros', 21],
    ['100€', 'cem euros', 100],
    ['1.000 €', 'mil euros', 1000],
    ['1000000€', 'um milhão de euros', 1e6],
    ['2.000.000 €', 'dois milhões de euros', 2e6],
    ['1200000€', 'um milhão e duzentos mil euros', 1200000],
    ['custa R$5 hoje', 'custa cinco reais hoje', 5],
    ['custa R$ 5 hoje', 'custa cinco reais hoje', 5],
    ['custa R$ 1 hoje', 'custa um real hoje', 1],
    ['5 reais', 'cinco reais', 5],
    ['1 real', 'um real', 1],
    ['$5', 'cinco dólares', 5],
    ['$1', 'um dólar', 1],
    ['£5', 'cinco libras', 5],
    ['£1', 'uma libra', 1],
    ['£2', 'duas libras', 2],
    ['£21', 'vinte e uma libras', 21],
    ['pagou 5€ ontem.', 'pagou cinco euros ontem.', 5],
    // a unit with no words gets a space
    ['5km', 'cinco km', 5],
    ['5kg', 'cinco kg', 5],
    ['5Kg', 'cinco Kg', 5],
    ['corre 5km por dia', 'corre cinco km por dia', 5],
    ['5 km', 'cinco km', 5],
    ['1km', 'um km', 1],
    // no words for these
    ['#5', '#5', 5],
    ['5,50€', '5,50€', 5.5],
    ['3,5km', '3,5km', 3.5],
    ['+5', '+cinco', 5],
  ]
  arr.forEach(a => {
    const [str, want, num] = a
    const doc = nlp(str)
    const m = doc.numbers().toText()
    t.equal(doc.text(), want, here + str)
    // the same view still has the number
    t.deepEqual(m.get(), [num], here + str + ' chained value')
    // the new text is still a number
    t.deepEqual(doc.numbers().get(), [num], here + str + ' value')
    t.deepEqual(nlp(want).numbers().get(), [num], here + want + ' parses')
  })
  t.end()
})

test('symbol round-trip:', function (t) {
  const arr = [
    ['50%', '50 %', 50],
    ['50 %', '50 %', 50],
    ['cinquenta por cento', '50 %', 50],
    ['5€', '5 euros', 5],
    ['€5', '5 euros', 5],
    ['5 €', '5 euros', 5],
    ['1€', '1 euro', 1],
    ['$5', '5 dólares', 5],
    ['custa R$ 5 hoje', 'custa 5 reais hoje', 5],
    ['1000000€', '1000000 euros', 1e6],
    ['dois milhões de euros', '2000000 euros', 2e6],
    ['um milhão de pessoas', '1000000 pessoas', 1e6],
    ['5km', '5 km', 5],
    ['5kg', '5 kg', 5],
  ]
  arr.forEach(a => {
    const [str, want, num] = a
    const doc = nlp(str)
    const m = doc.numbers().toText().toNumber()
    t.equal(doc.text(), want, here + str)
    t.deepEqual(m.get(), [num], here + str + ' chained value')
    t.deepEqual(doc.numbers().get(), [num], here + str + ' value')
  })
  // the role of the number is kept
  let doc = nlp('50%')
  doc.numbers().toText().toNumber()
  t.equal(doc.has('#Percent'), true, here + 'percent')
  doc = nlp('€5')
  doc.numbers().toText()
  t.equal(doc.has('#Money'), true, here + 'money')
  t.equal(doc.has('#Currency'), true, here + 'currency')
  doc.numbers().toNumber()
  t.equal(doc.has('#Money'), true, here + 'money, again')
  doc = nlp('5km')
  t.deepEqual(doc.numbers().toText().units().out('array'), ['km'], here + 'km unit')
  // a number that is already written is left alone
  t.equal(run('5 euros', m => m.toNumber()), '5 euros', here + '5 euros')
  t.equal(run('cinco euros', m => m.toNumber()), '5 euros', here + 'cinco euros')
  t.equal(run('cinco reais', m => m.toNumber()), '5 reais', here + 'cinco reais')
  t.equal(run('cinco euros', m => m.toText()), 'cinco euros', here + 'cinco euros toText')
  t.equal(run('5%', m => m.toNumber()), '5%', here + '5% toNumber')
  // 'de' comes and goes with the millions
  t.equal(run('2000000 pessoas', m => m.toText()), 'dois milhões de pessoas', here + 'de pessoas')
  t.equal(run('2000001 gatos', m => m.toText()), 'dois milhões e um gatos', here + 'no de')
  t.equal(run('dois milhões de euros', m => m.add(500000)), 'dois milhões e quinhentos mil euros', here + 'de is dropped')
  t.equal(run('dois milhões e quinhentos mil euros', m => m.add(500000)), 'três milhões de euros', here + 'de is added')
  t.equal(run('dois milhões', m => m.toNumber().toText()), 'dois milhões', here + 'no de without a noun')
  t.end()
})

test('symbol math:', function (t) {
  const arr = [
    // [str, add(1), set(7), subtract(2)]
    ['50%', '51%', '7%', '48%'],
    ['50 %', '51 %', '7 %', '48 %'],
    ['5€', '6€', '7€', '3€'],
    ['€5', '€6', '€7', '€3'],
    ['5 €', '6 €', '7 €', '3 €'],
    ['$5', '$6', '$7', '$3'],
    ['R$5', 'R$6', 'R$7', 'R$3'],
    ['R$ 5', 'R$ 6', 'R$ 7', 'R$ 3'],
    ['5 euros', '6 euros', '7 euros', '3 euros'],
    ['5 reais', '6 reais', '7 reais', '3 reais'],
    ['5km', '6km', '7km', '3km'],
    ['5kg', '6kg', '7kg', '3kg'],
    ['5Kg', '6Kg', '7Kg', '3Kg'],
    ['3,5km', '4,5km', '7km', '1,5km'],
    ['5,30€', '6,3€', '7€', '3,3€'],
    ['desceu -5% ontem', 'desceu -4% ontem', 'desceu 7% ontem', 'desceu -7% ontem'],
    ['+5%', '+6%', '+7%', '+3%'],
    ['cinquenta por cento', 'cinquenta e um por cento', 'sete por cento', 'quarenta e oito por cento'],
    ['cinco euros', 'seis euros', 'sete euros', 'três euros'],
    ['um euro', 'dois euros', 'sete euros', 'menos um euro'],
    ['três euros', 'quatro euros', 'sete euros', 'um euro'],
    ['um real', 'dois reais', 'sete reais', 'menos um real'],
    ['três reais', 'quatro reais', 'sete reais', 'um real'],
    ['vinte euros', 'vinte e um euros', 'sete euros', 'dezoito euros'],
    ['uma libra', 'duas libras', 'sete libras', 'menos uma libra'],
  ]
  arr.forEach(a => {
    const [str, add, set, minus] = a
    t.equal(run(str, m => m.add(1)), add, here + str + ' add')
    t.equal(run(str, m => m.increment()), add, here + str + ' increment')
    t.equal(run(str, m => m.set(7)), set, here + str + ' set')
    t.equal(run(str, m => m.subtract(2)), minus, here + str + ' subtract')
    // the value follows
    const before = nlp(str).numbers().get()[0]
    const doc = nlp(str)
    t.deepEqual(doc.numbers().add(1).get(), [before + 1], here + str + ' chained value')
    t.deepEqual(doc.numbers().get(), [before + 1], here + str + ' value')
  })
  // the unit agrees
  t.equal(run('5€', m => m.toText().set(1)), 'um euro', here + 'singular')
  t.equal(run('1€', m => m.toText().add(1)), 'dois euros', here + 'plural')
  t.equal(run('custa R$ 1 hoje', m => m.toText().add(1)), 'custa dois reais hoje', here + 'reais')
  // a negative number past zero
  t.equal(run('desceu -5% ontem', m => m.add(10)), 'desceu 5% ontem', here + '-5% + 10')
  t.equal(run('subiu 5% ontem', m => m.subtract(10)), 'subiu -5% ontem', here + '5% - 10')
  // tags are kept
  let doc = nlp('50%')
  doc.numbers().add(1)
  t.equal(doc.has('#Percent'), true, here + 'percent')
  doc = nlp('5km')
  doc.numbers().add(1)
  t.equal(doc.has('#Unit'), true, here + '6km unit')
  t.equal(doc.terms().length, 2, here + '6km is still split')
  doc = nlp('R$ 5')
  doc.numbers().add(1)
  t.equal(doc.has('#Money'), true, here + 'R$ 6 is money')
  t.end()
})

test('symbol ordinals:', function (t) {
  // an amount has no ordinal
  const arr = ['50%', '50 %', 'cinquenta por cento', '5€', '€5', '5 €', '1€', '$5', 'R$5', 'cinco euros', 'cinco reais', '5km', '5kg']
  arr.forEach(str => {
    t.equal(run(str, m => m.toOrdinal()), str, here + str + ' toOrdinal')
    t.equal(run(str, m => m.toCardinal()), str, here + str + ' toCardinal')
  })
  t.end()
})

test('symbols in a sentence:', function (t) {
  const doc = nlp('paga 5€ pelos 50% de 3km, ou seja $7.')
  const m = doc.numbers()
  t.deepEqual(m.toText().get(), [5, 50, 3, 7], here + 'toText values')
  t.equal(doc.text(), 'paga cinco euros pelos cinquenta por cento de três km, ou seja sete dólares.', here + 'toText')
  t.deepEqual(m.add(1).get(), [6, 51, 4, 8], here + 'add values')
  t.equal(doc.text(), 'paga seis euros pelos cinquenta e um por cento de quatro km, ou seja oito dólares.', here + 'add')
  t.deepEqual(m.toNumber().get(), [6, 51, 4, 8], here + 'toNumber values')
  t.equal(doc.text(), 'paga 6 euros pelos 51 % de 4 km, ou seja 8 dólares.', here + 'toNumber')
  t.equal(m.length, 4, here + 'still four numbers')
  t.end()
})
