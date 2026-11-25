import test from 'tape'
import nlp from '../../_lib.js'
const here = '[pt-european-numbers] '

// digits are read by the europeanNumbers plugin, from compromise/shared
test('decimal-comma numbers', function (t) {
  const arr = [
    ['3,50', 3.5],
    ['0,5', 0.5],
    ['1.000', 1000],
    ['1.234,56', 1234.56],
    ['1.234.567', 1234567],
    ['1 000', 1000],
    ['1,234', 1.234],
    // a period that can't be grouping thousands
    ['3.5', 3.5],
    ['-5', -5],
    ['−5', -5],
    ['-3,5', -3.5],
    ['3,5%', 3.5],
    ['5,30€', 5.3],
    ['€5,30', 5.3],
    ['1/2', 0.5],
    ["2,5 milhões", 2500000],
    ["menos cinco", -5],
    ["R$5,30", 5.3],
    ["R$ 1.234,56", 1234.56],
    ["2ª", 2],
    ["3.º", 3],
    ["1º", 1],
  ]
  arr.forEach(a => {
    t.deepEqual(nlp(a[0]).numbers().get(), [a[1]], here + a[0])
  })
  t.deepEqual(nlp("Custa 1.000.").numbers().get(), [1000], here + 'sentence-final period')
  t.deepEqual(nlp("Preço: 3,50, depois 4,20.").numbers().get(), [3.5, 4.2], here + 'trailing commas')
  t.end()
})

test('decimal-comma tags', function (t) {
  t.ok(nlp('1.234.567').has('#Cardinal'), here + 'period-grouped is a number')
  t.ok(nlp('3,5%').has('#Percent'), here + 'percent')
  t.ok(nlp('5,30€').has('#Money'), here + 'money suffix')
  t.ok(nlp('R$5,30').has('#Money'), here + 'money prefix')
  t.ok(nlp('2ª').has('#Ordinal'), here + 'ordinal')
  t.ok(nlp('12.05.2020').has('#Date'), here + 'dates are left alone')
  t.end()
})

test('decimal-comma output', function (t) {
  const arr = [
    // [text, add, result]
    ['3,50', 1, '4,5'],
    ['1.234,5', 1, '1.235,5'],
    ['1.000', 1, '1.001'],
    ['1 000', 1, '1 001'],
    ['999', 1, '1000'],
    ['5,30€', 1, '6,3€'],
    ['3,5%', 1, '4,5%'],
    ['-5', 1, '-4'],
    ['−5', 1, '-4'],
    ['-3,5', 5, '1,5'],
    ['3', -5, '-2'],
  ]
  arr.forEach(a => {
    const doc = nlp(a[0])
    doc.numbers().add(a[1])
    t.equal(doc.text(), a[2], here + `${a[0]} + ${a[1]}`)
  })
  let doc = nlp('1.234,5')
  doc.numbers().set(9876.5)
  t.equal(doc.text(), '9.876,5', here + 'set keeps the grouping')
  doc = nlp('-5')
  doc.numbers().toText()
  t.equal(doc.text(), "menos cinco", here + 'negative to text')
  doc = nlp('3,5')
  doc.numbers().toText()
  t.equal(doc.text(), '3,5', here + 'no words for a decimal')
  t.equal(nlp('1.234,56 €').numbers().json()[0].number.hasComma, true, here + 'json')
  t.end()
})
