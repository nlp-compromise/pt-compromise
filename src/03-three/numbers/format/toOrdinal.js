import data from '../data.js'
let toOrdinal = {}

data.ones.concat(data.tens, data.hundreds, data.multiples).forEach(a => {
  toOrdinal[a[1]] = a[2]
})

const toTextOrdinal = function (words) {
  words = words.map(w => {
    if (toOrdinal.hasOwnProperty(w)) {
      return toOrdinal[w]
    }
    return w
  })
  if (words.length === 3 && words[1] === 'e') {
    words = [words[0], words[2]]
  }
  return words.join(' ')
}

export default toTextOrdinal