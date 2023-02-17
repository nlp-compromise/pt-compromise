import {
  all, toConditional, toFutureTense, toImperativeNeg, toImperative, toImperfect,
  toPastTense, toPluperfect, toPresentTense,
  toGerund, toPastParticiple, toInfinitivo
} from './verbs/conjugate.js'

import {
  fromConditional, fromFutureTense, fromImperativeNeg, fromImperative,
  fromImperfect, fromPastTense, fromPluperfect, fromPresentTense,
  fromGerund, fromPastParticiple, fromInfinitivo
} from './verbs/toRoot.js'

import {
  all as allAdj, toFemale, toPlural, toFemalePlural, fromFemale, toSingular, fromFemalePlural,
} from './adjectives/index.js'

export default {
  verb: {
    all, toConditional, toFutureTense, toImperativeNeg, toImperative, toImperfect,
    toPastTense, toPluperfect, toPresentTense, toGerund, toPastParticiple, toInfinitivo,

    fromConditional, fromFutureTense, fromImperativeNeg, fromImperative, fromImperfect,
    fromPastTense, fromPluperfect, fromPresentTense,
    fromGerund, fromPastParticiple, fromInfinitivo
  },
  noun: {},
  adjective: {
    all: allAdj, toFemale, toPlural, toFemalePlural, fromFemale, toSingular, fromFemalePlural,
  },
}