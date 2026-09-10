import { convert, reverse } from 'suffix-thumb'
import model from './models.js'

let { plurals } = model.nouns

let rev = reverse(plurals)

const toPlural = (str) => convert(str, plurals)
const toSingular = (str) => convert(str, rev)

// masculine → feminine person-nouns
const exceptions = {
  ator: 'atriz',
  imperador: 'imperatriz',
  embaixador: 'embaixatriz',
  rei: 'rainha',
  'réu': 'ré',
  'herói': 'heroína',
  poeta: 'poetisa',
  conde: 'condessa',
  'príncipe': 'princesa',
  'barão': 'baronesa',
  'leão': 'leoa',
  'patrão': 'patroa',
  'europeu': 'europeia',
  'judeu': 'judia',
}
const revExceptions = Object.keys(exceptions).reduce((h, k) => {
  h[exceptions[k]] = k
  return h
}, {})

const toFeminine = function (str) {
  if (exceptions.hasOwnProperty(str)) {
    return exceptions[str]
  }
  // professor → professora
  if (/or$/.test(str)) {
    return str + 'a'
  }
  // freguês → freguesa
  if (/ês$/.test(str)) {
    return str.replace(/ês$/, 'esa')
  }
  // irmão → irmã, cidadão → cidadã
  if (/ão$/.test(str)) {
    return str.replace(/ão$/, 'ã')
  }
  // menino → menina
  if (/o$/.test(str)) {
    return str.replace(/o$/, 'a')
  }
  return str
}

const fromFeminine = function (str) {
  if (revExceptions.hasOwnProperty(str)) {
    return revExceptions[str]
  }
  // professora → professor
  if (/ora$/.test(str)) {
    return str.replace(/a$/, '')
  }
  // freguesa → freguês
  if (/esa$/.test(str)) {
    return str.replace(/esa$/, 'ês')
  }
  // irmã → irmão
  if (/ã$/.test(str)) {
    return str.replace(/ã$/, 'ão')
  }
  // menina → menino
  if (/a$/.test(str)) {
    return str.replace(/a$/, 'o')
  }
  return str
}

const all = function (str) {
  let arr = [str]
  arr.push(toPlural(str))
  arr = arr.filter(s => s)
  arr = new Set(arr)
  return Array.from(arr)
}

export {
  all,
  toPlural,
  toSingular,
  toFeminine,
  fromFeminine,
}
// console.log(all('maravilhoso'))
// console.log(toPlural("maravilhoso"))
