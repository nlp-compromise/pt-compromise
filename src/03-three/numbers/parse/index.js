import fromText from './fromText.js'

const isNumeric = term => /[0-9]/.test(term.text)

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
  const isText = m.has('#TextValue')
  // any digits come first - '2,5 milhões'
  const split = terms.findIndex(t => !isNumeric(t))
  const digits = split === -1 ? terms : terms.slice(0, split)
  const words = split === -1 ? [] : terms.slice(split)
  let res = { num: null, prefix: '', suffix: '', hasComma: false }
  if (digits.length > 0) {
    res = fromNumber(digits, m)
  }
  if (isText) {
    const num = fromText(words)
    // '2,5 milhões' is 2.5 * 1,000,000
    if (res.num !== null && num) {
      res.num = Number((res.num * num).toPrecision(15))
    } else {
      res.num = num
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
    isText,
    isOrdinal: m.has('#Ordinal'),
    isFraction: m.has('#Fraction'),
    isMoney: m.has('#Money'),
  }
}
export default parseNumber
