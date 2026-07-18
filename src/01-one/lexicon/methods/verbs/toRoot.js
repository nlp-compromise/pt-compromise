import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'

let {
  conditional, futureTense, imperativeNeg, imperative, imperfect, pastTense,
  pluperfect, presentTense, gerunds, pastParticiple, infinitivo,
  subjPresent, subjImperfect, subjFuture,
} = model

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
let subjPresentRev = revAll(subjPresent)
let subjImperfectRev = revAll(subjImperfect)
let subjFutureRev = revAll(subjFuture)
let gerundsRev = reverse(gerunds.gerunds)
let pastParticipleRev = reverse(pastParticiple.pastParticiple)

const forms = {
  'FirstPerson': 'first',
  'SecondPerson': 'second',
  'ThirdPerson': 'third',
  'FirstPersonPlural': 'firstPlural',
  'SecondPersonPlural': 'secondPlural',
  'ThirdPersonPlural': 'thirdPlural',
}
const fromAll = function (str, form, m) {
  if (forms.hasOwnProperty(form) && m[forms[form]]) {
    return convert(str, m[forms[form]])
  }
  // an ambiguous form, like 'falava' (1st or 3rd person) has no person-tag -
  // try each person's model until one converts it
  let keys = Object.keys(m)
  for (let i = 0; i < keys.length; i += 1) {
    let out = convert(str, m[keys[i]])
    if (out !== str) {
      return out
    }
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
const fromSubjPresent = (str, form) => fromAll(str, form, subjPresentRev)
const fromSubjImperfect = (str, form) => fromAll(str, form, subjImperfectRev)
const fromSubjFuture = (str, form) => fromAll(str, form, subjFutureRev)
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
  fromInfinitivo,
  fromSubjPresent,
  fromSubjImperfect,
  fromSubjFuture,
}
