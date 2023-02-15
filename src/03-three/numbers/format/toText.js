import data from '../data.js'
let ones = data.ones.reverse()
let tens = data.tens.reverse()
let hundreds = data.hundreds.reverse()

let multiples = [
  [1000000000, 'bilhão', 'bilhões'],
  [1000000, 'milhão', 'milhões'],
  [1000, 'mil', 'mil'],
  // [100, 'cento'],
  [1, 'um', 'um'],
]

//turn number into an array of magnitudes, like [[5, million], [2, hundred]]
const getMagnitudes = function (num) {
  let working = num
  let have = []
  multiples.forEach(a => {
    if (num >= a[0]) {
      let howmany = Math.floor(working / a[0])
      working -= howmany * a[0]
      if (howmany) {
        let str = a[1]
        if (howmany > 1) {
          str = a[2]//use plural version
        }
        have.push({
          unit: str,
          num: howmany,
        })
      }
    }
  })
  return have
}

// do 'mil e duzentos' but 'mil duzentos e quinze'
const andRules = function (words) {
  let index = words.findIndex((w, i) => w === 'mil' && words[i + 1] === 'e')
  if (index !== -1) {
    // we have another 'e' after..
    let hasAfter = words.slice(index + 2).find(w => w === 'e')
    if (hasAfter) {
      // remove the 'e'
      words.splice(index + 1, 1)
    }
  }
  return words
}

const threeDigit = function (num) {
  let words = []
  // 100-900
  for (let i = 0; i < hundreds.length; i += 1) {
    if (hundreds[i][0] <= num) {
      words.push(hundreds[i][1])
      num -= hundreds[i][0]
      break
    }
  }
  // 30-90
  for (let i = 0; i < tens.length; i += 1) {
    if (tens[i][0] <= num) {
      // 'e vinte'
      if (words.length > 0) {
        words.push('e')
      }
      words.push(tens[i][1])
      num -= tens[i][0]
      break
    }
  }
  if (num === 0) {
    return words
  }
  // 0-29
  for (let i = 0; i < ones.length; i += 1) {
    if (ones[i][0] <= num) {
      // 'e sete'
      if (words.length > 0) {
        words.push('e')
      }
      words.push(ones[i][1])
      num -= ones[i][0]
      break
    }
  }
  return words
}

const toText = function (num) {
  if (num === 0) {
    return ['zero']
  }
  let words = []
  if (num < 0) {
    words.push('menos')
    num = Math.abs(num)
  }
  // handle multiples
  let found = getMagnitudes(num)
  found.forEach((obj, i) => {
    let res = threeDigit(obj.num)
    if (res[0] === 'cem' && res.length > 1) {
      res[0] = 'cento'
    }
    words = words.concat(res)
    if (obj.unit !== 'um') {
      words.push(obj.unit)
      if (found[i + 1]) {
        // mil e duzentos
        words.push('e')
      }
    }
  })
  // 'uno mil' -> 'mil'
  if (words.length > 1 && words[0] === 'um' && words[1] === 'mil') {
    words = words.slice(1)
  }
  // complex 'mil e ..' rules:
  words = andRules(words)
  return words
}
export default toText