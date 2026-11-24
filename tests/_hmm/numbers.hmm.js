import test from 'tape'
import nlp from '../_lib.js'
const here = '[pt-numbers-hmm] '

// in portuguese the comma is the decimal separator, and the period groups thousands
test('decimal comma:', function (t) {
  const arr = [
    ['custa 3,50 euros', 3.5],
    ['cerca de 2,5 quilos', 2.5],
    ['custa 1.000 euros', 1000],
    ['custa 1.234,56 euros', 1234.56],
    ['25.000 habitantes', 25000],
    ['três vírgula cinco', 3.5],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.deepEqual(nlp(str).numbers().get(), [want], here + str)
  })
  t.end()
})

test('negative numbers:', function (t) {
  t.deepEqual(nlp('menos 5 graus').numbers().get(), [-5], here + 'menos 5')
  t.end()
})
