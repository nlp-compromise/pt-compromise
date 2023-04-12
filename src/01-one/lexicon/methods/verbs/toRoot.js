import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'

let { conditional, futureTense, imperativeNeg, imperative, imperfect, pastTense, pluperfect, presentTense, gerunds, pastParticiple, infinitivo } = model

// =-=-
const revAll = function (m) {
  return Object.keys(m).reduce((h, k) => {
    h[k] = reverse(m[k])
    return h
  }, {})
}

let conditionalRev = revAll(conditional)
let futureTenseRev = revAll(futureTense)
let imperativeNegRev = revAll(imperativeNeg)
let imperativeRev = revAll(imperative)
let imperfectRev = revAll(imperfect)
let pastTenseRev = revAll(pastTense)
let pluperfectRev = revAll(pluperfect)
let presentTenseRev = revAll(presentTense)
let infinitivoRev = revAll(infinitivo)
let gerundsRev = reverse(gerunds.gerunds)
let pastParticipleRev = reverse(pastParticiple.pastParticiple)

const fromAll = function (str, form, m) {
  let forms = {
    'FirstPerson': (s) => convert(s, m.first),
    'SecondPerson': (s) => convert(s, m.second),
    'ThirdPerson': (s) => convert(s, m.third),
    'FirstPersonPlural': (s) => convert(s, m.firstPlural),
    'SecondPersonPlural': (s) => convert(s, m.secondPlural),
    'ThirdPersonPlural': (s) => convert(s, m.thirdPlural),
  }
  if (forms.hasOwnProperty(form)) {
    return forms[form](str)
  }
  return str
}


const fromConditional = (str, form) => fromAll(str, form, conditionalRev)
const fromFutureTense = (str, form) => fromAll(str, form, futureTenseRev)
const fromImperativeNeg = (str, form) => fromAll(str, form, imperativeNegRev)
const fromImperative = (str, form) => fromAll(str, form, imperativeRev)
const fromImperfect = (str, form) => fromAll(str, form, imperfectRev)
const fromPastTense = (str, form) => fromAll(str, form, pastTenseRev)
const fromPluperfect = (str, form) => fromAll(str, form, pluperfectRev)
const fromPresentTense = (str, form) => fromAll(str, form, presentTenseRev)
const fromInfinitivo = (str, form) => fromAll(str, form, infinitivoRev)
const fromGerund = (str) => convert(str, gerundsRev)
const fromPastParticiple = (str) => convert(str, pastParticipleRev)

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

// console.log(fromImperfect('cresciam', 'ThirdPersonPlural'))
// console.log(fromPastParticiple('falado'))