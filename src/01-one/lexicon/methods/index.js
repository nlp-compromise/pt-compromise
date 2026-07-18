import {
  all, toConditional, toFutureTense, toImperativeNeg, toImperative, toImperfect,
  toPastTense, toPluperfect, toPresentTense,
  toGerund, toPastParticiple, toInfinitivo,
  toSubjPresent, toSubjImperfect, toSubjFuture,
} from './verbs/conjugate.js'

import {
  fromConditional, fromFutureTense, fromImperativeNeg, fromImperative,
  fromImperfect, fromPastTense, fromPluperfect, fromPresentTense,
  fromGerund, fromPastParticiple, fromInfinitivo,
  fromSubjPresent, fromSubjImperfect, fromSubjFuture,
} from './verbs/toRoot.js'

import {
  all as allAdj, toFemale, toPlural, toFemalePlural, fromFemale, toSingular, fromFemalePlural,
} from './adjectives/index.js'

import {
  all as allNoun, toPlural as toPluralNoun, toSingular as toSingularNoun
} from './nouns.js'


export default {
  verb: {
    all, toConditional, toFutureTense, toImperativeNeg, toImperative, toImperfect,
    toPastTense, toPluperfect, toPresentTense, toGerund, toPastParticiple, toInfinitivo,
    toSubjPresent, toSubjImperfect, toSubjFuture,

    fromConditional, fromFutureTense, fromImperativeNeg, fromImperative, fromImperfect,
    fromPastTense, fromPluperfect, fromPresentTense,
    fromGerund, fromPastParticiple, fromInfinitivo,
    fromSubjPresent, fromSubjImperfect, fromSubjFuture,
  },
  noun: {
    all: allNoun, toPlural: toPluralNoun, toSingular: toSingularNoun,
  },
  adjective: {
    all: allAdj, toFemale, toPlural, toFemalePlural, fromFemale, toSingular, fromFemalePlural,
  },
}
