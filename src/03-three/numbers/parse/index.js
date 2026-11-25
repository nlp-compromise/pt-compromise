import scan from './fromText.js'

// read digits with the shared european-numbers plugin - '1.234,56', '-5', '3,5%'
const fromNumber = function (terms, m) {
  const { read } = m.methods.two.europeanNumbers
  const locale = m.model.two.europeanNumbers
  const pre = terms[0].pre
  // thousands may be split-up by a space - '1 000'
  const res = read(terms.map(t => t.text).join(' '), pre, locale)
  if (res.num !== null || terms.length === 1) {
    return res
  }
  return read(terms[0].text, pre, locale)
}

const parseNumber = function (m) {
  const terms = m.docs[0]
  const found = scan(terms)[0] || { num: null }
  let res = { num: found.num, prefix: '', suffix: '', hasComma: false }
  // any digits come first - '2,5 milhões'
  if (found.digits) {
    res = fromNumber(terms.slice(found.digits[0], found.digits[1]), m)
    if (res.num !== null) {
      // '2,5 milhões' is 2.5 * 1,000,000 - without the noise of a float
      const num = res.num * found.mult
      res.num = (Number.isInteger(num) ? num : Number(num.toPrecision(15))) * (found.neg ? -1 : 1)
    }
  }
  return {
    hasComma: res.hasComma,
    prefix: res.prefix,
    num: res.num,
    suffix: res.suffix,
    // how the digits were written
    decimal: res.decimal,
    group: res.group,
    // '.º', 'ª' or 'o'
    ordinal: res.ordinal || null,
    isText: m.has('#TextValue'),
    isOrdinal: m.has('#Ordinal'),
    isFraction: m.has('#Fraction'),
    isMoney: m.has('#Money'),
  }
}
export default parseNumber
