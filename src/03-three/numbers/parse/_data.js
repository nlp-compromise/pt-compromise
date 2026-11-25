import data from '../data.js'

// 'três' is often written 'tres', and 'milhão' as 'milhao'
const noAccent = str => str.normalize('NFD').replace(/\p{M}/gu, '')

// number-words, and their values
const cardinals = { zero: 0, cem: 100, uma: 1, duas: 2, ...data.cardinals }
const ordinals = { ...data.ordinals }
const multiples = {}
// the bottom of a fraction - 'três quartos'
const fractions = { meio: 2, meia: 2, meios: 2, terço: 3, terços: 3, centésimos: 100, milésimos: 1000 }

const list = [...data.ones, ...data.tens, ...data.hundreds]
list.forEach(a => {
  const [num, card, ord] = a
  cardinals[card] = num
  if (ord) {
    ordinals[ord] = num
  }
  // 'duzentas'
  if (num > 100) {
    cardinals[card.replace(/os$/, 'as')] = num
  }
  // 'quintos'
  if (num > 3 && num <= 10) {
    fractions[ord + 's'] = num
  }
})
data.multiples.forEach(a => {
  const [num, single, plural, ord] = a
  multiples[single] = num
  multiples[plural] = num
  ordinals[ord] = num
})
;[cardinals, ordinals, multiples].forEach(obj => {
  Object.keys(obj).forEach(k => {
    obj[noAccent(k)] = obj[k]
  })
})
// 'milhão', and anything larger
const bigs = new Set(Object.keys(multiples).filter(k => multiples[k] > 1000))

// how large can the word after this one be? - 'cento' leaves room for 'vinte', and then for 'três'
// - 'cem' is a whole hundred, and an ordinal ten has its ones - 'décimo primeiro'
const getRoom = function (v, w, isOrd) {
  if (v >= 100) {
    return w === 'cem' ? 0 : 100
  }
  if (v >= 20 || isOrd) {
    return v % 10 === 0 ? 10 : 0
  }
  return 0
}

// 'primeira', 'primeiros' or 'primeiras' -> 1
const getOrdinal = function (w) {
  const single = w.replace(/s$/, '')
  const str = [w, single, single.replace(/a$/, 'o')].find(s => ordinals.hasOwnProperty(s))
  return str === undefined ? undefined : ordinals[str]
}

// the words that are a number, wherever they are - 'um', 'uma' and 'meio' are tagged by their neighbours
const words = {}
Object.keys(cardinals).forEach(k => {
  words[k] = ['Cardinal', 'TextValue']
})
Object.keys(multiples).forEach(k => {
  words[k] = ['Cardinal', 'TextValue']
})
// 'primeiro', 'primeira', 'primeiros', 'primeiras'
Object.keys(ordinals).forEach(k => {
  const fem = k.replace(/o$/, 'a')
  ;[k, fem, k + 's', fem + 's'].forEach(str => {
    words[str] = ['Ordinal', 'TextValue']
  })
})
delete words.um
delete words.uma

export { cardinals, ordinals, multiples, fractions, bigs, getOrdinal, getRoom, words }
