import test from 'tape'
import nlp from './_lib.js'
let here = '[root-match] '
nlp.verbose(false)

test('root-match:', function (t) {
  let arr = [
    // ===verbs===
    // past-tense
    ['wir gingen', 'wir {gehen}'],
    // present-tense
    ['Spencer geht langsam', '#Person {gehen} .'],


  ]
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str)
    let tags = doc.json()[0].terms.map(term => term.tags[0])
    let msg = `'${(str + "' ").padEnd(20, ' ')}  - '${tags.join(', ')}'`
    t.equal(doc.has(match), true, here + msg)
  })
  t.end()
})
