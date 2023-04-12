import { convert } from 'suffix-thumb'
import model from '../models.js'
const forms = ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural']

let {
  conditional,
  futureTense,
  imperativeNeg,
  imperative,
  imperfect,
  pastTense,
  pluperfect,
  presentTense,
  gerunds,
  pastParticiple,
  infinitivo
} = model


const allForms = function (str, m) {
  return forms.reduce((h, form) => {
    h[form] = convert(str, m[form])
    return h
  }, {})
}

const toConditional = (str) => allForms(str, conditional)
const toFutureTense = (str) => allForms(str, futureTense)
const toImperativeNeg = (str) => allForms(str, imperativeNeg)
const toImperative = (str) => allForms(str, imperative)
const toImperfect = (str) => allForms(str, imperfect)
const toPastTense = (str) => allForms(str, pastTense)
const toPluperfect = (str) => allForms(str, pluperfect)
const toPresentTense = (str) => allForms(str, presentTense)
const toInfinitivo = (str) => allForms(str, infinitivo)
const toGerund = (str) => convert(str, gerunds)
const toPastParticiple = (str) => convert(str, pastParticiple)




// // an array of every inflection, for '{inf}' syntax
const all = function (str) {
  let res = [str].concat(
    Object.values(toConditional(str)),
    Object.values(toFutureTense(str)),
    Object.values(toImperativeNeg(str)),
    Object.values(toImperative(str)),
    Object.values(toImperfect(str)),
    Object.values(toPastTense(str)),
    Object.values(toPluperfect(str)),
    Object.values(toPresentTense(str)),
    Object.values(toInfinitivo(str)),
    toGerund(str),
    toPastParticiple(str),
  ).filter(s => s)
  res = new Set(res)
  return Array.from(res)
}

export {
  all,
  toConditional,
  toFutureTense,
  toImperativeNeg,
  toImperative,
  toImperfect,
  toPastTense,
  toPluperfect,
  toPresentTense,
  toGerund,
  toPastParticiple,
  toInfinitivo
}
// console.log(all('broxar'))


// console.log(toImperfect('crescer'))
