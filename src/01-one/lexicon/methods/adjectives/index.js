import { toPlural as nounPlural, fromPlural as nounSingular } from '../nouns/index.js'
import { big, eu } from '../nouns/feminine.js'
import { isWord } from '../nouns/rules.js'

// [male, female]
const irregular = { bom: 'boa', mau: 'má', cru: 'crua', nu: 'nua', judeu: 'judia', espanhol: 'espanhola', andaluz: 'andaluza' }
const fromIrregular = {}
Object.keys(irregular).forEach((k) => {
  fromIrregular[irregular[k]] = k
})
// '-ês' and '-or' add an '-a' - 'inglesa', 'trabalhadora' - but not 'cortês', 'incolor', 'maior'
const gendered = /([^t]ês|[dts]or)$/
// '-a' adjectives that have no '-o' form - 'otimista', 'agrícola', 'belga'
const commonA = /^(persa|maia|celta|rosa|lilás|violeta|laranja)$|([ií]sta|ícola|icida|crata|ócrita|[ip]ota|belga|asteca|ômade|ígena)$/
// .. but these ones do - 'mista', 'prevista'
const notCommon = /^(mista|(im|pre)?vista)$/
// '-esa' that is '-ês' - 'portuguesa', 'francesa' - but 'obesa'
const esa = /(gu|gl|anc|coc|[aoi]n|land|am)esa$/

// irregulars -> endings that add an '-a' -> '-o'
// 'bonito' -> 'bonita', 'inglês' -> 'inglesa', but 'grande' -> 'grande'
const toFemale = (str) => {
  if (irregular.hasOwnProperty(str)) {
    return irregular[str]
  }
  if (str.endsWith('o') && !str.endsWith('ão')) {
    return str.slice(0, -1) + 'a'
  }
  // 'alemão' -> 'alemã', but 'chorão' -> 'chorona'
  if (str.endsWith('ão')) {
    return big.test(str) ? str.slice(0, -2) + 'ona' : str.slice(0, -1)
  }
  if (gendered.test(str)) {
    return str.replace(/ês$/, 'es') + 'a'
  }
  // 'europeu' -> 'europeia'
  return eu.test(str) ? str.slice(0, -1) + 'ia' : str
}
// the same spelling rules as the nouns - 'feliz' -> 'felizes', 'fácil' -> 'fáceis'
const toPlural = (str) => nounPlural(str)
const toFemalePlural = (str) => nounPlural(toFemale(str))

// 'bonita' -> 'bonito', 'inglesa' -> 'inglês', but 'otimista' -> 'otimista'
// 'lex' is an optional lexicon, to look for the adjective in
const fromFemale = (str, lex) => {
  if (fromIrregular.hasOwnProperty(str)) {
    return fromIrregular[str]
  }
  // 'alemã' -> 'alemão', 'chorona' -> 'chorão'
  if (str.endsWith('ã') || big.test(str.slice(0, -3) + 'ão')) {
    return str.replace(/(ã|ona)$/, 'ão')
  }
  if (!str.endsWith('a')) {
    return str
  }
  const stem = str.slice(0, -1)
  const o = stem + 'o'
  if (isWord(o, lex)) {
    return o
  }
  // 'europeia' -> 'europeu'
  if (eu.test(stem.slice(0, -1) + 'u')) {
    return stem.slice(0, -1) + 'u'
  }
  // 'trabalhadora' -> 'trabalhador', 'inglesa' -> 'inglês'
  if (/[dts]ora$/.test(str)) {
    return stem
  }
  if (esa.test(str)) {
    return stem.slice(0, -2) + 'ês'
  }
  return (commonA.test(str) && !notCommon.test(str)) || isWord(str, lex) ? str : o
}
const toSingular = (str, lex) => nounSingular(str, lex)
const fromFemalePlural = (str, lex) => (/[aãá]s$/.test(str) ? fromFemale(str.slice(0, -1), lex) : nounSingular(str, lex))

const all = function (str) {
  const arr = [str, toFemale(str), toPlural(str), toFemalePlural(str)]
  return Array.from(new Set(arr))
}

export { all, toFemale, toPlural, toFemalePlural, fromFemale, toSingular, fromFemalePlural }
