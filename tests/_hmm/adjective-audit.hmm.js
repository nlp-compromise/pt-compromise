import test from 'tape'
import nlp from '../_lib.js'
import list from '../unit/adjectives/_audit.js'
const here = '[pt-adjective-audit-hmm] '

const before = { male: 'ele é ', female: 'ela é ', plural: 'eles são ', femalePlural: 'elas são ' }

// forms marked with a '*' in _audit.js - they inflect properly as bare words, but the tagger does not see an adjective.
//  - 'seco', 'ativo' - their forms are the verbs 'secar' and 'ativar' ('ele seca', 'eu ativo'), which win in the lexicon
//  - 'regular' - is the infinitive 'regular' in the lexicon
//  - 'são', 'vão' - are 'eles são' and 'eles vão' first
test('adjective audit, tagging:', function (t) {
  list.forEach((o) => {
    o.hmm.forEach((k) => {
      const str = before[k] + o.forms[k]
      t.deepEqual(nlp(str).adjectives().conjugate(), [o.forms], here + str)
    })
  })
  t.end()
})
