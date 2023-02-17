import { convert, reverse } from 'suffix-thumb'
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

// =-=-
const revAll = function (m) {
  return Object.keys(m).reduce((h, k) => {
    h[k] = reverse(m[k])
    return h
  }, {})
}

conditional = revAll(conditional)
futureTense = revAll(futureTense)
imperativeNeg = revAll(imperativeNeg)
imperative = revAll(imperative)
imperfect = revAll(imperfect)
pastTense = revAll(pastTense)
pluperfect = revAll(pluperfect)
presentTense = revAll(presentTense)
infinitivo = revAll(infinitivo)
gerunds = reverse(gerunds.gerunds)
pastParticiple = reverse(pastParticiple.pastParticiple)


const allForms = function (str, m) {
  return forms.reduce((h, form) => {
    h[form] = convert(str, m[form])
    return h
  }, {})
}

const fromConditional = (str) => allForms(str, conditional)
const fromFutureTense = (str) => allForms(str, futureTense)
const fromImperativeNeg = (str) => allForms(str, imperativeNeg)
const fromImperative = (str) => allForms(str, imperative)
const fromImperfect = (str) => allForms(str, imperfect)
const fromPastTense = (str) => allForms(str, pastTense)
const fromPluperfect = (str) => allForms(str, pluperfect)
const fromPresentTense = (str) => allForms(str, presentTense)
const fromInfinitivo = (str) => allForms(str, infinitivo)
const fromGerund = (str) => convert(str, gerunds)
const fromPastParticiple = (str) => convert(str, pastParticiple)

export {
  fromConditional,
  fromFutureTense,
  fromImperativeNeg,
  fromImperative,
  fromImperfect,
  fromPastTense,
  fromPluperfect,
  fromPresentTense,
  fromGerund,
  fromPastParticiple,
  fromInfinitivo
}
