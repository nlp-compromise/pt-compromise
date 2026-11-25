import data from '../data.js'

// words for each part of a number
const cardinals = {}
const ordinals = {}
;[...data.ones, ...data.tens, ...data.hundreds].forEach(a => {
  cardinals[a[0]] = a[1]
  ordinals[a[0]] = a[2]
})
const bigs = data.multiples.filter(a => a[0] > 1000)

// 'uma', 'duas', 'duzentas'
const toFemale = str => str.replace(/^um$/, 'uma').replace(/^dois$/, 'duas').replace(/entos$/, 'entas')

// 1-999 - 'cento e vinte e um'
const toGroup = function (num, fem) {
  if (num === 100) {
    return ['cem']
  }
  const rest = num % 100
  let parts = [num - rest]
  if (rest < 20) {
    parts.push(rest)
  } else {
    parts.push(rest - (rest % 10), rest % 10)
  }
  parts = parts.filter(n => n).map(n => (fem ? toFemale(cardinals[n]) : cardinals[n]))
  return parts.join(' e ').split(' ')
}

// an 'e' goes before the last group, when that is under a hundred, or is whole hundreds
// - 'mil e cem' and 'dois mil e três', but 'mil cento e vinte'
const join = function (groups) {
  let words = []
  groups.forEach((a, i) => {
    const [count, arr] = a
    if (i > 0 && i === groups.length - 1 && (count < 100 || count % 100 === 0)) {
      words.push('e')
    }
    words = words.concat(arr)
  })
  return words
}

// each group of a number, and how many of them there are - [[2, ['dois', 'milhões']], [500, ['quinhentos', 'mil']]]
const toGroups = function (num, fem) {
  const out = []
  let rest = num
  bigs.forEach(a => {
    const [size, single, plural] = a
    const count = Math.floor(rest / size)
    rest -= count * size
    // 'um milhão', 'dois milhões' - a million is masculine
    if (count === 1) {
      out.push([count, ['um', single]])
    } else if (count) {
      out.push([count, join(toGroups(count, false)).concat(plural)])
    }
  })
  const mil = Math.floor(rest / 1000)
  // 'mil', and not 'um mil'
  if (mil) {
    out.push([mil, mil === 1 ? ['mil'] : toGroup(mil, fem).concat('mil')])
  }
  if (rest % 1000) {
    out.push([rest % 1000, toGroup(rest % 1000, fem)])
  }
  return out
}

// write a whole number as words - `opts.isFemale` is 'uma', 'duas' and 'duzentas'
const toText = function (num, opts = {}) {
  if (!Number.isSafeInteger(num)) {
    return null
  }
  if (num === 0) {
    return ['zero']
  }
  const words = num < 0 ? ['menos'] : []
  return words.concat(join(toGroups(Math.abs(num), opts.isFemale)))
}

// 'centésimo vigésimo primeiro' - up to 1999, and 'milionésimo'
const toTextOrdinal = function (num, opts = {}) {
  let words = []
  let rest = num
  const big = data.multiples.find(a => a[0] === num)
  if (big) {
    words.push(big[3])
  } else if (!Number.isInteger(num) || num < 1 || num >= 2000) {
    return null
  } else {
    if (rest > 1000) {
      words.push('milésimo')
      rest -= 1000
    }
    const ones = rest % 10
    const tens = (rest % 100) - ones
    words = words.concat([rest - tens - ones, tens, ones].filter(n => n).map(n => ordinals[n]))
  }
  // every word agrees - 'décima primeira', 'vigésimos primeiros'
  if (opts.isFemale) {
    words = words.map(w => w.replace(/o$/, 'a'))
  }
  return opts.isPlural ? words.map(w => w + 's') : words
}
export { toText, toTextOrdinal }
