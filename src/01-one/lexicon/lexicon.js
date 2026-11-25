import lexData from './_data.js'
import { unpack } from 'efrt'
import methods from './methods/index.js'
import misc from './misc.js'
import { properNouns } from 'compromise/shared'

const { toPresentTense, toPastTense, toFutureTense, toConditional, toImperative,
  toImperativeNeg, toImperfect, toPluperfect, toGerund, toPastParticiple, toInfinitivo,
  toSubjPresent, toSubjImperfect, toSubjFuture } = methods.verb
const lexicon = {}

const tagMap = {
  first: 'FirstPerson',
  second: 'SecondPerson',
  third: 'ThirdPerson',
  firstPlural: 'FirstPersonPlural',
  secondPlural: 'SecondPersonPlural',
  thirdPlural: 'ThirdPersonPlural',
}

// verb-forms that are also another word - 'conto', 'visita', 'casa'
const verbForms = {}
const isVerb = (tags) => /Tense|Imper|Subj|Cond|Plup|Infin|Gerund|Partic|Copula|Person|Verb/.test(tags)
// forms of an adjective that are also another word - 'cara', 'bonita', 'interior'
const adjForms = {}
const adj = methods.adjective
// 'antiga', 'antigos' are in the list, beside 'antigo'
const isInflected = (w, words) => [adj.fromFemale(w), adj.toSingular(w), adj.fromFemalePlural(w)].some((s) => s !== w && words.hasOwnProperty(s))
const addToLex = function (obj, tags, lex) {
  // find forms that repeat across persons, like 'falava' (1st + 3rd)
  const counts = {}
  Object.values(obj).forEach(w => {
    counts[w] = (counts[w] || 0) + 1
  })
  Object.keys(obj).forEach(k => {
    const w = obj[k]
    // skip the person-tag for ambiguous forms
    const out = counts[w] > 1 ? tags : tags.concat([tagMap[k]])
    if (!lex[w]) {
      lex[w] = out
    } else if (!isVerb(lex[w]) && !verbForms[w]) {
      verbForms[w] = out
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
  const wordsObj = unpack(lexData[tag])
  Object.keys(wordsObj).forEach(w => {
    if (tag === 'Adjective' && isInflected(w, wordsObj)) {
      return
    }
    if (lexicon[w] && isVerb(lexicon[w]) && tag !== 'Infinitive') {
      verbForms[w] = lexicon[w]
    }
    if (lexicon[w] && /Adjective/.test(lexicon[w])) {
      adjForms[w] = lexicon[w]
    }
    lexicon[w] = tag

    // add conjugations for our verbs
    if (tag === 'Infinitive') {
      conjugations.forEach(a => {
        const obj = a[0](w)
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
      const s = methods.adjective.toPlural(w)
      lexicon[s] = lexicon[s] || ['Adjective', 'MaleAdjective', 'PluralAdjective']
      const f = methods.adjective.toFemale(w)
      lexicon[f] = lexicon[f] || ['Adjective', 'FemaleAdjective', 'SingularAdjective']
      const fs = methods.adjective.toFemalePlural(w)
      lexicon[fs] = lexicon[fs] || ['Adjective', 'FemaleAdjective', 'PluralAdjective']
    }
    if (tag === 'Noun') {
      lexicon[w] = lexicon[w] || ['Noun']
      // the noun wins over a form of an adjective - 'estrangeiros', 'trabalhadora'
      const add = function (str, tags, old) {
        const isAdj = /Adjective/.test(lexicon[str])
        if (isAdj) {
          adjForms[str] = lexicon[str]
        }
        if (!lexicon[str] || isAdj || lexicon[str] === old) {
          lexicon[str] = tags
        }
      }
      add(methods.noun.toPlural(w), 'Plural')
      // professor → professora, menino → menina - but not 'pai' → 'mãe'
      const fem = methods.noun.toFeminine(w)
      if (fem !== w && fem.slice(0, 2) === w.slice(0, 2)) {
        add(fem, ['Noun', 'FemaleNoun', 'Singular'], 'Noun')
        add(methods.noun.toPlural(fem), ['Noun', 'FemaleNoun', 'Plural'], 'Plural')
      }
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


// names of people and places, shared by every language - our own words win
Object.keys(properNouns).forEach(tag => {
  Object.keys(unpack(properNouns[tag])).forEach(w => {
    lexicon[w] = lexicon[w] || tag
  })
})

export { verbForms, adjForms }
export default lexicon
