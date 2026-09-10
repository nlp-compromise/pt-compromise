import conditional from './conditional.js'
import futureTense from './future-tense.js'
import imperativeNeg from './imperative-negative.js'
import imperative from './imperative.js'
import pastTense from './past-tense.js'
import pluperfect from './pluperfect.js'
import imperfect from './imperfect.js'
import presentTense from './present-tense.js'
import infinitive from './infinitive.js'
import subjPresent from './subjunctive/subj-present.js'
import subjImperfect from './subjunctive/subj-imperfect.js'
import subjFuture from './subjunctive/subj-future.js'

const vbOrder = ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural']
// imperatives have no first-person singular form
const impOrder = ['second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural']
const todo = {
  conditional: { data: conditional, keys: vbOrder },
  futureTense: { data: futureTense, keys: vbOrder },
  imperativeNeg: { data: imperativeNeg, keys: impOrder },
  imperative: { data: imperative, keys: impOrder },
  imperfect: { data: imperfect, keys: vbOrder },
  pastTense: { data: pastTense, keys: vbOrder },
  pluperfect: { data: pluperfect, keys: vbOrder },
  presentTense: { data: presentTense, keys: vbOrder },
  infinitivo: { data: infinitive, keys: vbOrder },
  subjPresent: { data: subjPresent, keys: vbOrder },
  subjImperfect: { data: subjImperfect, keys: vbOrder },
  subjFuture: { data: subjFuture, keys: vbOrder },
}

// turn our conjugation data into word-pairs
let model = {}
Object.keys(todo).forEach(k => {
  model[k] = {}
  let { data, keys } = todo[k]
  keys.forEach((form, i) => {
    let pairs = []
    Object.keys(data).forEach(inf => {
      // defective verbs have missing forms - their positions are unreliable
      if (data[inf].length !== keys.length) {
        return
      }
      let str = data[inf][i]
      // some scraped forms are alternates, like 'faz ou faze'
      if (str && / ou /.test(str)) {
        str = str.split(' ou ')[0]
      }
      if (inf && str && !/ /.test(str)) {
        pairs.push([inf, str])
      }
    })
    model[k][form] = pairs
  })
})

export default model
