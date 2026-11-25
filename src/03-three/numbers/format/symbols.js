// the words for a symbol that is written on a number - '50%', '5€', 'R$5'
// [singular, plural, tag, isFemale]
const symbols = {
  '%': ['por cento', 'por cento', 'Unit'],
  '€': ['euro', 'euros', 'Currency'],
  $: ['dólar', 'dólares', 'Currency'],
  us$: ['dólar', 'dólares', 'Currency'],
  r$: ['real', 'reais', 'Currency'],
  '£': ['libra', 'libras', 'Currency', true],
  '¥': ['iene', 'ienes', 'Currency'],
}

// 'euros' -> '€' - to find a unit that is already written out
const fromWord = {}
Object.keys(symbols).forEach(k => {
  const [single, plural] = symbols[k]
  fromWord[single] = fromWord[single] || k
  fromWord[plural] = fromWord[plural] || k
})

// a unit that can stand as its own word - 'km', 'kg', 'm²'
const isWord = /^\p{L}+[²³]?$/u

// 'cinco euros', but 'um euro'
const unitWords = function (key, num) {
  const [single, plural] = symbols[key]
  return Math.abs(num) === 1 ? single : plural
}

export { symbols, fromWord, isWord, unitWords }
