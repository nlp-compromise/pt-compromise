import test from 'tape'
import nlp from '../_lib.js'
import list from '../unit/nouns/_audit.js'
const here = '[pt-noun-audit-hmm] '

// phrases marked with a '*' in _audit.js - they inflect properly as bare words, but not after their article,
// because the tagger does not find the noun.
//  - 'o segundo' - an Ordinal first ('o segundo andar'), and a second after that
//  - 'o milhão', 'os milhões' - a Cardinal, which .numbers() wants - not a noun to inflect
//  - 'o senhor', 'os senhores', 'a gente' - are pronouns in the lexicon, as two words ('you', 'we')
//  - 'a colher' - is 'a' + the infinitive 'colher' ('começou a colher')
test('noun audit, tagging:', function (t) {
  list.forEach((o) => {
    const want = [{ singular: o.singular.noun, plural: o.plural.noun }]
    ;[o.singular, o.plural].filter((p) => p.hmm).forEach((p) => {
      const res = nlp(p.str).nouns().conjugate().map((c) => ({ singular: c.singular, plural: c.plural }))
      t.deepEqual(res, want, here + p.str)
    })
  })
  t.end()
})

// words that the nouns leave behind
test('noun articles:', function (t) {
  const arr = [
    // adjectives, and verbs, do not follow their noun
    ['a casa amarela', 'as casas amarelas'],
    ['o gato come', 'os gatos comem'],
    // 'os senhores' is a pronoun in the lexicon, and not a plural noun
    ['os senhores', 'as senhoras'],
  ]
  arr.forEach((a, i) => {
    const doc = nlp(a[0])
    if (i < 2) {
      doc.nouns().toPlural()
    } else {
      doc.nouns().toFeminine()
    }
    t.equal(doc.text(), a[1], here + a[0])
  })
  t.end()
})

// an article, or a pronoun
test('article or clitic:', function (t) {
  // a name that the lexicon does not know, before the pronoun
  t.ok(nlp('João a visita cada semana').has('#Pronoun #Verb'), here + 'João a visita')
  // 'voltar a casa' is a preposition, but 'vender a casa' is an article
  t.ok(nlp('voltei a casa').has('#Preposition #Noun'), here + 'voltei a casa')
  // a noun after a negation - 'não a casa, mas o jardim' - but 'não a casa' is 'does not marry her'
  t.ok(nlp('não a casa, mas o jardim').has('^não #Determiner #Noun'), here + 'não a casa, mas')
  // 'limpa' is an adjective in the lexicon, before it is a verb
  t.ok(nlp('ela limpa a mesa').has('^ela #Verb'), here + 'ela limpa')
  // 'está a comer' - the 'a' is tagged as an auxiliary, with 'está'
  t.ok(nlp('ele está a comer').has('está #Preposition comer'), here + 'está a comer')
  t.end()
})
