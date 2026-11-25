import { cardinals, multiples, bigs, getRoom } from '../../03-three/numbers/parse/_data.js'

// number-words that are known by their neighbours
//  - 'um' and 'uma' are articles, and are a number only inside of one - 'um milhão', 'cento e um',
//    'trinta e uma' - or before a unit - 'um euro', 'um km', 'um por cento' - or when a sentence
//    gives it no word to be the article of - 'tenho um.', 'um, dois e três'
//  - 'e' joins the parts of a number - 'cento e vinte e três', 'mil e cem' - but 'três e quatro' are two numbers
const isOne = /^uma?$/
// 'três quartos'
const parts = /^(meios|terços|quartos|quintos|sextos|sétimos|oitavos|nonos|décimos|centésimos|milésimos)$/
const isHalf = /^mei[oa]$/
const isComma = /^v[íi]rgula$/
// 'segunda-feira' is a day
const isFeira = /^(segunda|terça|quarta|quinta|sexta)$/
// 'pelo menos cinco', 'mais ou menos cinco'
const notMinus = new Set(['pelo', 'o', 'ao', 'ou', 'nem', 'muito', 'pouco', 'bem', 'nada'])

const cardinal = ['Cardinal', 'TextValue']
const fraction = ['Fraction', 'TextValue']
const has = (term, tag) => Boolean(term) && term.tags.has(tag)
const isText = term => has(term, 'TextValue') && has(term, 'Cardinal')

// how large can the word after 'e' be? - 'vinte e três', 'cento e vinte', 'mil e cem'
const roomAfter = w => (multiples.hasOwnProperty(w) ? 1000 : getRoom(cardinals[w], w, false))

const tagNumbers = function (view) {
  const world = view.world
  const setTag = world.methods.one.setTag
  // 'euros', 'reais'
  const money = new Set(world.model.two.europeanNumbers.currencies)
  const isCurrency = term => has(term, 'Currency') || (Boolean(term) && money.has(term.normal))
  view.docs.forEach(terms => {
    // are these two words side-by-side?
    const joins = i => Boolean(terms[i] && terms[i + 1]) && !/\S/.test(terms[i].post + terms[i + 1].pre)
    // start again - an article, noun or adjective is now a number
    const tag = function (i, tags, reason) {
      if (terms[i].frozen !== true) {
        terms[i].tags.clear()
        setTag([terms[i]], tags, world, false, reason)
      }
    }
    // tag the whole number, before this word
    const tagBefore = function (i, str, reason) {
      for (let n = i - 1; n >= 0 && joins(n) && has(terms[n], 'Value'); n -= 1) {
        setTag([terms[n]], str, world, false, reason)
      }
    }
    const str = i => (terms[i] ? terms[i].normal : '')
    // does a number begin here?
    const isNumber = i => has(terms[i], 'Value') || (isOne.test(str(i)) && joins(i) && bigs.has(str(i + 1)))
    for (let i = 0; i < terms.length; i += 1) {
      const term = terms[i]
      const w = term.normal
      const before = joins(i - 1)
      const after = joins(i)
      if (isOne.test(w)) {
        // 'um milhão', 'um euro', 'um por cento'
        let found = after && (bigs.has(str(i + 1)) || isCurrency(terms[i + 1]) || has(terms[i + 1], 'Unit'))
        found = found || (after && joins(i + 1) && str(i + 1) === 'por' && str(i + 2) === 'cento')
        // 'um meio', 'um terço' - but 'um meio de transporte'
        const isMeans = str(i + 1) === 'meio' && joins(i + 1) && str(i + 2) === 'de'
        if (after && /^(meio|terço)$/.test(str(i + 1)) && !isMeans) {
          found = true
          tag(i + 1, fraction, 'um-terço')
        }
        // 'só tenho um.' - but the word by itself is still the article
        if (found || (!after && terms.length > 1)) {
          tag(i, cardinal, 'um-number')
        }
      } else if (w === 'e') {
        if (before && after && isText(terms[i - 1])) {
          const next = str(i + 1)
          const room = roomAfter(str(i - 1))
          if (cardinals[next] > 0 && cardinals[next] < room && !/[0-9]/.test(next)) {
            // 'cento e vinte', 'trinta e uma'
            tag(i, 'TextValue', 'vinte-e-três')
            if (isOne.test(next)) {
              tag(i + 1, cardinal, 'vinte-e-um')
            }
          } else if (isHalf.test(next)) {
            // 'dois e meio', 'um milhão e meio'
            tag(i, 'TextValue', 'dois-e-meio')
            tag(i + 1, fraction, 'dois-e-meio')
          } else if (next === 'mil' && bigs.has(str(i - 1))) {
            // 'um milhão e mil'
            tag(i, 'TextValue', 'milhão-e-mil')
          }
        }
      } else if (w === 'menos') {
        // 'menos cinco', but 'três menos dois' and 'pelo menos cinco'
        const prev = terms[i - 1]
        const isLess = Boolean(prev) && (notMinus.has(prev.normal) || notMinus.has(prev.machine))
        if (after && isNumber(i + 1) && !has(terms[i + 1], 'Ordinal') && !has(prev, 'Value') && !isLess) {
          // 'menos 5' is still written in digits
          tag(i, has(terms[i + 1], 'NumericValue') ? 'Value' : 'TextValue', 'menos-cinco')
        }
      } else if (isComma.test(w)) {
        // 'três vírgula cinco'
        if (before && after && isText(terms[i - 1]) && isText(terms[i + 1])) {
          tag(i, 'TextValue', 'três-vírgula-cinco')
        }
      } else if (w === 'por' && after && str(i + 1) === 'cento' && before && has(terms[i - 1], 'Value')) {
        // 'cinco por cento'
        tagBefore(i, 'Percent', 'por-cento')
        tag(i, 'Unit', 'por-cento')
        tag(i + 1, 'Unit', 'por-cento')
        i += 1
      } else if (isCurrency(term) && before && has(terms[i - 1], 'Value')) {
        // 'vinte e um euros'
        tagBefore(i, 'Money', 'value-currency')
        setTag([term], 'Currency', world, false, 'value-currency')
      } else if (parts.test(w)) {
        if (before && isText(terms[i - 1])) {
          tag(i, fraction, 'três-quartos')
        }
      } else if (isHalf.test(w) && !has(term, 'Fraction')) {
        // 'meio milhão', 'meio km', or the word by itself
        if (terms.length === 1 || (after && (bigs.has(str(i + 1)) || has(terms[i + 1], 'Unit')))) {
          tag(i, fraction, 'meio')
        }
      } else if (w === 'segundos' && before && has(terms[i - 1], 'Cardinal')) {
        // 'cinco segundos' are not fifths
        tag(i, ['Noun', 'Plural'], 'cinco-segundos')
      } else if (w === 'segundo' && has(term, 'Ordinal') && after && !has(terms[i - 1], 'Determiner')) {
        // 'segundo ele', 'segundo o jornal'
        if (['Determiner', 'Pronoun', 'ProperNoun'].some(t => has(terms[i + 1], t))) {
          tag(i, 'Preposition', 'segundo-ele')
        }
      } else if (isFeira.test(w) && terms[i + 1] && str(i + 1) === 'feira' && /^-?$/.test(term.post.trim())) {
        tag(i, 'WeekDay', 'segunda-feira')
        tag(i + 1, 'WeekDay', 'segunda-feira')
        i += 1
      }
    }
  })
}
export default tagNumbers
