import { toNumber, toCardinal, multiples } from './vocabulary.js'

const normalize = str => {
  // fem to masc
  str = str.replace(/as?$/, 'o')
  // plural to sing
  str = str.replace(/os$/, 'o')
  return str
}

const fromText = function (terms) {
  let sum = 0
  let carry = 0
  let minus = false

  let tokens = terms.map(o => o.normal || o.text).filter(str => str)
  for (let i = 0; i < tokens.length; i += 1) {
    let w = tokens[i] || ''
    // minus eight
    if (w === 'menos') {
      minus = true
      continue
    }
    if (w === 'e') {
      continue
    }
    // 'huitieme'
    if (toCardinal.hasOwnProperty(w)) {
      w = toCardinal[w]
    }
    // 'cent'
    if (multiples.hasOwnProperty(w)) {
      let mult = multiples[w] || 1
      if (carry === 0) {
        carry = 1
      }
      // console.log('carry', carry, 'mult', mult, 'sum', sum)
      sum += mult * carry
      carry = 0
      continue
    }
    // 'tres'
    if (toNumber.hasOwnProperty(w)) {
      carry += toNumber[w]
    } else {
      let str = normalize(w)
      if (toNumber.hasOwnProperty(str)) {
        carry += toNumber[str]
      }
      // console.log(terms.map(t => t.text))
    }
  }
  // include any remaining
  if (carry !== 0) {
    sum += carry
  }
  if (minus === true) {
    sum *= -1
  }
  return sum
}
export default fromText