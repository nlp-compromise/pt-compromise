import lexData from './_data.js'
import { unpack } from 'efrt'
import methods from './methods/index.js'
import misc from './misc.js'

const { toPresentTense, toPastTense, toFutureTense, toConditional, toImperative,
  toImperativeNeg, toImperfect, toPluperfect, toGerund, toPastParticiple, toInfinitivo,
  toSubjPresent, toSubjImperfect, toSubjFuture } = methods.verb
let lexicon = {}

const tagMap = {
  first: 'FirstPerson',
  second: 'SecondPerson',
  third: 'ThirdPerson',
  firstPlural: 'FirstPersonPlural',
  secondPlural: 'SecondPersonPlural',
  thirdPlural: 'ThirdPersonPlural',
}
const addToLex = function (obj, tags, lex) {
  // find forms that repeat across persons, like 'falava' (1st + 3rd)
  let counts = {}
  Object.values(obj).forEach(w => {
    counts[w] = (counts[w] || 0) + 1
  })
  Object.keys(obj).forEach(k => {
    let w = obj[k]
    if (!lex[w]) {
      // skip the person-tag for ambiguous forms
      if (counts[w] > 1) {
        lex[w] = tags
      } else {
        lex[w] = tags.concat([tagMap[k]])
      }
    }
  })
}

// which tense-models produce which tags
const conjugations = [
  [toPresentTense, ['PresentTense']],
  [toPastTense, ['PastTense']],
  [toFutureTense, ['FutureTense']],
  [toConditional, ['Conditional']],
  [toImperative, ['Imperative']],
  [toImperativeNeg, ['Imperative']],
  [toImperfect, ['Imperfect']],
  [toPluperfect, ['Pluperfect']],
  [toInfinitivo, ['Infinitive']],
  // subjunctive forms that overlap the above (like 'fale') keep their first tag,
  // distinct ones ('falasse', 'fizer', 'quiser'..) are added here
  [toSubjPresent, ['Subjunctive', 'PresentTense']],
  [toSubjImperfect, ['Subjunctive', 'Imperfect']],
  [toSubjFuture, ['Subjunctive', 'FutureTense']],
]

Object.keys(lexData).forEach(tag => {
  let wordsObj = unpack(lexData[tag])
  Object.keys(wordsObj).forEach(w => {
    lexicon[w] = tag

    // add conjugations for our verbs
    if (tag === 'Infinitive') {
      conjugations.forEach(a => {
        let obj = a[0](w)
        addToLex(obj, a[1], lexicon)
      })
      // add gerund
      let str = toGerund(w)
      lexicon[str] = lexicon[str] || 'Gerund'
      // add PastParticiple
      str = toPastParticiple(w)
      lexicon[str] = lexicon[str] || 'PastParticiple'
    }
    if (tag === 'Adjective') {
      let s = methods.adjective.toPlural(w)
      lexicon[s] = lexicon[s] || ['Adjective', 'MaleAdjective', 'PluralAdjective']
      let f = methods.adjective.toFemale(w)
      lexicon[f] = lexicon[f] || ['Adjective', 'FemaleAdjective', 'SingularAdjective']
      let fs = methods.adjective.toFemalePlural(w)
      lexicon[fs] = lexicon[fs] || ['Adjective', 'FemaleAdjective', 'PluralAdjective']
    }
    if (tag === 'Noun') {
      lexicon[w] = lexicon[w] || ['Noun']
      let pl = methods.noun.toPlural(w)
      lexicon[pl] = lexicon[pl] || 'Plural'
    }
    if (tag === 'Cardinal') {
      lexicon[w] = ['Cardinal', 'TextValue']
    }
    if (tag === 'Ordinal') {
      lexicon[w] = ['Ordinal', 'TextValue']
    }
  })
})

Object.assign(lexicon, misc)

// console.log(lexicon['acordado'])
// console.log(Object.keys(lexicon).length)


export default lexicon
