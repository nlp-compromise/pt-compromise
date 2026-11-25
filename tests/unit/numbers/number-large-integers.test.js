import test from 'tape'
import nlp from '../../_lib.js'
import { europeanNumbers } from 'compromise/shared'
const here = '[pt-large-integers] '

// a 16-digit number is still a safe integer - tidying float-noise must not round it
test('large integers keep every digit:', function (t) {
  const { write } = europeanNumbers.methods.two.europeanNumbers
  t.equal(write(9007199254740991, {}), '9007199254740991', here + 'write(MAX_SAFE_INTEGER)')
  const doc = nlp('1234567890123456')
  doc.numbers().add(1)
  t.equal(doc.text(), '1234567890123457', here + '16 digits + 1')
  t.equal(nlp('0,1').numbers().add(0.2).text(), '0,3', here + 'float noise is still tidied')
  t.end()
})
