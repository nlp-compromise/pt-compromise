import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'

const { f, mp, fp } = model.adjectives

const fRev = reverse(f)
const mpRev = reverse(mp)
const fpRev = reverse(fp)

const toFemale = (str) => convert(str, f)
const toPlural = (str) => convert(str, mp)
const toFemalePlural = (str) => convert(str, fp)
const fromFemale = (str) => convert(str, fRev)
const toSingular = (str) => convert(str, mpRev)
const fromFemalePlural = (str) => convert(str, fpRev)

const all = function (str) {
  let arr = [str]
  arr.push(toFemale(str))
  arr.push(toPlural(str))
  arr.push(toFemalePlural(str))
  arr = arr.filter(s => s)
  arr = new Set(arr)
  return Array.from(arr)
}

export {
  all,
  toFemale,
  toPlural,
  toFemalePlural,
  fromFemale,
  toSingular,
  fromFemalePlural,
}
// console.log(all('maravilhoso'))
// console.log(toPlural("maravilhoso"))