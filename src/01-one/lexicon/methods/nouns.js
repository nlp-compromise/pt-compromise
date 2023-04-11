import { convert, reverse } from 'suffix-thumb'
import model from './models.js'

let { plurals } = model.nouns

let rev = reverse(plurals)

const toPlural = (str) => convert(str, plurals)
const toSingular = (str) => convert(str, rev)

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
}
// console.log(all('maravilhoso'))
// console.log(toPlural("maravilhoso"))