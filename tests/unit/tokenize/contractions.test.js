import test from 'tape'
import nlp from '../../_lib.js'
const here = '[pt-contractions] '
nlp.verbose(false)

// [contraction, its two implicit words]
const arr = [
  // de + article
  ['do', 'de', 'o'],
  ['da', 'de', 'a'],
  ['dos', 'de', 'os'],
  ['das', 'de', 'as'],
  ['dum', 'de', 'um'],
  ['duma', 'de', 'uma'],
  // em + article
  ['no', 'em', 'o'],
  ['na', 'em', 'a'],
  ['nas', 'em', 'as'],
  ['num', 'em', 'um'],
  ['numa', 'em', 'uma'],
  ['nuns', 'em', 'uns'],
  ['numas', 'em', 'umas'],
  // a + article
  ['ao', 'a', 'o'],
  ['aos', 'a', 'os'],
  ['à', 'a', 'a'],
  ['às', 'a', 'as'],
  // por + article
  ['pelo', 'por', 'o'],
  ['pela', 'por', 'a'],
  ['pelos', 'por', 'os'],
  ['pelas', 'por', 'as'],
  // para + article
  ['pro', 'para', 'o'],
  ['pra', 'para', 'a'],
  // preposition + pronoun
  ['dele', 'de', 'ele'],
  ['dela', 'de', 'ela'],
  ['deles', 'de', 'eles'],
  ['delas', 'de', 'elas'],
  ['nele', 'em', 'ele'],
  ['nela', 'em', 'ela'],
  ['comigo', 'com', 'mim'],
  ['contigo', 'com', 'ti'],
  ['consigo', 'com', 'si'],
  ['conosco', 'com', 'nós'],
  // preposition + demonstrative
  ['deste', 'de', 'este'],
  ['desta', 'de', 'esta'],
  ['disto', 'de', 'isto'],
  ['desse', 'de', 'esse'],
  ['dessa', 'de', 'essa'],
  ['disso', 'de', 'isso'],
  ['daquele', 'de', 'aquele'],
  ['daquela', 'de', 'aquela'],
  ['daquilo', 'de', 'aquilo'],
  ['neste', 'em', 'este'],
  ['nesta', 'em', 'esta'],
  ['nisto', 'em', 'isto'],
  ['nesse', 'em', 'esse'],
  ['nessa', 'em', 'essa'],
  ['nisso', 'em', 'isso'],
  ['naquele', 'em', 'aquele'],
  ['naquela', 'em', 'aquela'],
  ['naquilo', 'em', 'aquilo'],
  ['àquele', 'a', 'aquele'],
  ['àquela', 'a', 'aquela'],
  // preposition + adverb
  ['daqui', 'de', 'aqui'],
  ['dali', 'de', 'ali'],
  ['aonde', 'a', 'onde'],
  ['donde', 'de', 'onde'],
]

test('contractions are split into two implicit terms:', function (t) {
  arr.forEach(a => {
    const [word, one, two] = a
    const doc = nlp(`foi ${word} hoje`)
    const implicit = doc.docs[0].filter(term => term.implicit).map(term => term.implicit)
    t.deepEqual(implicit, [one, two], here + `${word} → ${one} + ${two}`)
    t.equal(doc.has(`foi ${one} ${two} hoje`), true, here + `match '${one} ${two}'`)
    t.equal(doc.has(`foi ${word} hoje`), true, here + `match '${word}'`)
    t.equal(doc.text(), `foi ${word} hoje`, here + `text of '${word}'`)
    t.equal(doc.wordCount(), 3, here + `'${word}' is one word`)
  })
  t.end()
})

test('contractions in a sentence:', function (t) {
  const list = [
    // [text, match, text of match]
    ['Gosto do livro da Maria.', 'de o livro', 'do livro'],
    ['Gosto do livro da Maria.', 'de a maria', 'da Maria'],
    ['Vou ao mercado', 'a o mercado', 'ao mercado'],
    ['Vou ao mercado', 'o mercado', 'mercado'],
    ['Estou no parque', 'em o parque', 'no parque'],
    ['Moro numa casa', 'em uma casa', 'numa casa'],
    ['Passei pela rua', 'por a rua', 'pela rua'],
    ['Vou à praia', 'a a praia', 'à praia'],
    ['Penso nisso', 'penso em isso', 'Penso nisso'],
    ['Falou comigo', 'com mim', 'comigo'],
    ['o gato dele', 'de ele', 'dele'],
    // capitalised
    ['Do nada', 'de o nada', 'Do nada'],
    ['NA PRAIA', 'em a praia', 'NA PRAIA'],
  ]
  list.forEach(a => {
    const [str, reg, want] = a
    t.equal(nlp(str).match(reg).text(), want, here + `'${str}' match '${reg}'`)
  })
  t.end()
})

test('not contractions:', function (t) {
  const list = ['nos vemos amanhã', 'ele nos viu', 'eu gosto de café', 'uma casa bonita', 'para o mercado']
  list.forEach(str => {
    const found = nlp(str).docs[0].some(term => term.implicit)
    t.equal(found, false, here + str)
  })
  t.end()
})

test(`d'água:`, function (t) {
  const doc = nlp(`um copo d'água`)
  t.equal(doc.has('copo de água'), true, here + 'matches expanded')
  t.equal(doc.match('de água').text(), `d'água`, here + 'text is unchanged')
  t.equal(doc.wordCount(), 3, here + 'counts once')
  t.end()
})
