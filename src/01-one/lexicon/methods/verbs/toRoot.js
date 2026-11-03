import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'

const {
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

const conditionalRev = revAll(conditional)
const futureTenseRev = revAll(futureTense)
const imperativeNegRev = revAll(imperativeNeg)
const imperativeRev = revAll(imperative)
const imperfectRev = revAll(imperfect)
const pastTenseRev = revAll(pastTense)
const pluperfectRev = revAll(pluperfect)
const presentTenseRev = revAll(presentTense)
const infinitivoRev = revAll(infinitivo)
const subjPresentRev = revAll(subjPresent)
const subjImperfectRev = revAll(subjImperfect)
const subjFutureRev = revAll(subjFuture)
const gerundsRev = reverse(gerunds.gerunds)
const pastParticipleRev = reverse(pastParticiple.pastParticiple)

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
  const keys = Object.keys(m)
  for (let i = 0; i < keys.length; i += 1) {
    const out = convert(str, m[keys[i]])
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
