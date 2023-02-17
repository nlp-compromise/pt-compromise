import conditional from './conditional.js'
import futureTense from './future-tense.js'
import imperativeNeg from './imperative-negative.js'
import imperative from './imperative.js'
import imperfect from './subj-past.js'
import pastTense from './past-tense.js'
import pluperfect from './pluperfect.js'
import presentTense from './subj-present.js'

const vbOrder = ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural']
const todo = {
  conditional: { data: conditional, keys: vbOrder },
  futureTense: { data: futureTense, keys: vbOrder },
  imperativeNeg: { data: imperativeNeg, keys: vbOrder },
  imperative: { data: imperative, keys: vbOrder },
  imperfect: { data: imperfect, keys: vbOrder },
  pastTense: { data: pastTense, keys: vbOrder },
  pluperfect: { data: pluperfect, keys: vbOrder },
  presentTense: { data: presentTense, keys: vbOrder },
}

// turn our conjugation data into word-pairs
let model = {}
Object.keys(todo).forEach(k => {
  model[k] = {}
  let { data, keys } = todo[k]
  keys.forEach((form, i) => {
    let pairs = []
    Object.keys(data).forEach(inf => {
      if (inf && data[inf][i]) {
        pairs.push([inf, data[inf][i]])
      }
    })
    model[k][form] = pairs
  })
})

export default model
