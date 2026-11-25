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

import { all as allNoun, toPlural as toPluralNoun, fromPlural as fromPluralNoun } from './nouns/index.js'
import { toFeminine, fromFeminine, isCommon } from './nouns/feminine.js'
import { isSingular } from './nouns/rules.js'


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
    all: allNoun, toPlural: toPluralNoun, fromPlural: fromPluralNoun, toSingular: fromPluralNoun,
    toFeminine, fromFeminine, isCommon, isSingular,
  },
  adjective: {
    all: allAdj, toFemale, toPlural, toFemalePlural, fromFemale, toSingular, fromPlural: toSingular, fromFemalePlural,
  },
}
