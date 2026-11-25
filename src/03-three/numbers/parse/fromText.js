import { cardinals, multiples, fractions, getOrdinal, getRoom } from './_data.js'

const isDigit = term => /[0-9]/.test(term.text)
// is there anything between these two words? - 'três, quatro'
const isBroken = (a, b) => /\S/.test(a.post + b.pre)
// 'mil', and anything larger
const getMult = term => (term && multiples.hasOwnProperty(term.normal) ? multiples[term.normal] : 0)

// digits, and the words that multiply them - '1 000', '2,5 milhões', '3 mil milhões'
const readDigits = function (terms, i, res) {
  let end = i + 1
  const joins = () => terms[end] && !isBroken(terms[end - 1], terms[end])
  if (/^[0-9]{1,3}$/.test(terms[i].text)) {
    while (joins() && /^[0-9]{3}$/.test(terms[end].text)) {
      end += 1
    }
  }
  res.digits = [i, end]
  res.mult = 1
  if (/^[-+−]?[0-9][0-9.,]*$/.test(terms[end - 1].text)) {
    if (joins() && getMult(terms[end]) === 1000) {
      res.mult = 1000
      end += 1
    }
    if (joins() && getMult(terms[end]) > 1000) {
      res.mult *= getMult(terms[end])
      end += 1
    }
  }
  res.end = end
  return res
}

// read the one number that begins at this term, and say where it ends
// - each new word must fit beside the ones before it, so 'dois três' is two numbers
// - inside of a group, the words are joined by 'e' - 'cento e vinte e três' - so 'vinte três' is two numbers
// - a new group may begin without one - 'mil cento e vinte', 'mil e cem'
const readNumber = function (terms, start) {
  const res = { start, end: start + 1, num: null, neg: false }
  let i = start
  if (terms[i].normal === 'menos' && terms[i + 1] && !isBroken(terms[i], terms[i + 1])) {
    res.neg = true
    i += 1
  }
  if (isDigit(terms[i])) {
    return readDigits(terms, i, res)
  }
  const isOrd = terms[i].tags.has('Ordinal')
  // 'décima-primeira'
  const breaks = (a, b) => isBroken(a, b) && !(isOrd && a.post === '-' && !b.pre)
  let total = 0 // the millions
  let section = 0 // the thousands
  let group = 0 // the hundreds, tens and ones
  // the next word must be smaller than this
  let room = 1000
  // nothing is in this group yet
  let fresh = true
  let lastBig = Infinity
  let lastMult = 1
  let usedMil = false
  let afterE = false
  let any = false
  let int = null // the whole part, before a 'vírgula'
  let zeros = ''
  let over = 1
  let extra = 0
  for (; i < terms.length; i += 1) {
    const term = terms[i]
    const w = term.normal
    const next = terms[i + 1]
    const joins = Boolean(next) && !isBroken(term, next)
    if ((i > start && breaks(terms[i - 1], term)) || isDigit(term)) {
      break
    }
    if (term.tags.has('Fraction') && fractions.hasOwnProperty(w)) {
      if (isOrd || int !== null) {
        break
      }
      // 'meio milhão'
      if (!any) {
        group = 1 / fractions[w]
        room = 0
        fresh = false
        any = true
        continue
      }
      // 'dois e meio', 'um milhão e meio', or 'três quartos'
      if (afterE) {
        extra = lastMult / fractions[w]
      } else {
        over = fractions[w]
      }
      i += 1
      break
    }
    if (w === 'e') {
      if (!any || isOrd || afterE || !joins || isDigit(next)) {
        break
      }
      const v = cardinals[next.normal]
      const isHalf = int === null && next.tags.has('Fraction') && fractions[next.normal] === 2
      // 'um milhão e mil'
      const isMil = fresh && total > 0 && section === 0 && getMult(next) === 1000
      if (isHalf || isMil || (v > 0 && v < room)) {
        afterE = true
        continue
      }
      break
    }
    // 'três vírgula cinco'
    if (w === 'vírgula' || w === 'virgula') {
      if (!any || isOrd || int !== null || !joins || !cardinals.hasOwnProperty(next.normal)) {
        break
      }
      int = total + section + group
      total = 0
      section = 0
      group = 0
      room = 1000
      fresh = true
      continue
    }
    if (isOrd !== term.tags.has('Ordinal')) {
      break
    }
    const mult = isOrd ? 0 : getMult(term)
    if (mult) {
      // 'mil mil', 'dois milhões três milhões'
      if (int !== null || (mult === 1000 ? usedMil : mult >= lastBig)) {
        break
      }
      if (mult === 1000) {
        section = (group || 1) * 1000
      } else {
        total += (section + group || 1) * mult
        section = 0
        lastBig = mult
      }
      usedMil = mult === 1000
      lastMult = mult
      group = 0
      room = 1000
      fresh = true
      afterE = false
      any = true
      continue
    }
    const v = isOrd ? getOrdinal(w) : cardinals[w]
    if (v === undefined) {
      break
    }
    // 'três vírgula zero cinco'
    if (v === 0 && int !== null && fresh) {
      zeros += '0'
      continue
    }
    // 'milésimo primeiro'
    if (v >= 1000 && !any) {
      total = v
      any = true
      continue
    }
    // 'dois três', 'zero um', and 'vinte três' - but 'vinte e três', and 'vigésimo terceiro'
    if (v >= room || (v === 0 && any) || (!isOrd && !fresh && !afterE)) {
      break
    }
    room = getRoom(v, w, isOrd)
    group += v
    fresh = false
    afterE = false
    any = true
  }
  if (!any) {
    // an unknown word is its own number - and a loose 'e' is nothing
    return /^(e|v[íi]rgula|menos)$/.test(terms[start].normal) ? null : res
  }
  let num = total + section + group
  if (int !== null) {
    num = Number(int + '.' + zeros + group)
  }
  num = (num / over) + extra
  res.num = res.neg ? num * -1 : num
  res.end = i
  return res
}

// split these terms into each of their numbers
const scan = function (terms) {
  const out = []
  let i = 0
  while (i < terms.length) {
    const res = readNumber(terms, i)
    if (res) {
      out.push(res)
    }
    i = res ? res.end : i + 1
  }
  return out
}
export default scan
