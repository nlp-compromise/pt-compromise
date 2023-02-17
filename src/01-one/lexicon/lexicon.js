import lexData from './_data.js'
import { unpack } from 'efrt'
import methods from './methods/index.js'
import misc from './misc.js'

const { toPresentTense, toPastTense, toFutureTense, toConditional, toImperative,
  toImperativeNeg, toImperfect, toPluperfect, toGerund, toPastParticiple } = methods.verb
let lexicon = misc

const tagMap = {
  first: 'FirstPerson',
  second: 'SecondPerson',
  third: 'ThirdPerson',
  firstPlural: 'FirstPersonPlural',
  secondPlural: 'SecondPersonPlural',
  thirdPlural: 'ThirdPersonPlural',
}
const addToLex = function (obj, tag, lex) {
  Object.keys(obj).forEach(k => {
    let w = obj[k]
    if (!lex[w]) {
      lex[w] = [tag, tagMap[k]]
    }
  })
}

Object.keys(lexData).forEach(tag => {
  let wordsObj = unpack(lexData[tag])
  Object.keys(wordsObj).forEach(w => {
    lexicon[w] = tag

    // add conjugations for our verbs
    if (tag === 'Infinitive') {
      // add present tense
      let obj = toPresentTense(w)
      addToLex(obj, 'PresentTense', lexicon)
      // add past tense
      obj = toPastTense(w)
      addToLex(obj, 'PastTense', lexicon)
      // add future tense
      obj = toFutureTense(w)
      addToLex(obj, 'FutureTense', lexicon)
      // add conditional
      obj = toConditional(w)
      addToLex(obj, 'Conditional', lexicon)
      // add imperative
      obj = toImperative(w)
      addToLex(obj, 'Imperative', lexicon)
      obj = toImperativeNeg(w)
      addToLex(obj, 'Imperative', lexicon)
      // add Imperfect
      obj = toImperfect(w)
      addToLex(obj, 'Imperfect', lexicon)
      // add toPluperfect
      obj = toPluperfect(w)
      addToLex(obj, 'Pluperfect', lexicon)
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
    if (tag === 'Cardinal') {
      lexicon[w] = ['Cardinal', 'TextValue']
    }
    if (tag === 'Ordinal') {
      lexicon[w] = ['Ordinal', 'TextValue']
    }
  })
})
// console.log(lexicon['ele'])

export default lexicon