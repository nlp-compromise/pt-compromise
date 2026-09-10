import test from 'tape'
import nlp from './_lib.js'
let here = '[tagger] '

test('common sentences:', function (t) {
  let arr = [
    ['Eu falo português', '#Pronoun #PresentTense .'],
    ['Ela está muito feliz', '#Pronoun #Copula #Adverb #Adjective'],
    ['O menino come pão', '#Determiner #Noun #PresentTense #Noun'],
    ['Ele falou com a professora', '#Pronoun #PastTense #Preposition #Determiner #Noun'],
    ['Quem comeu o bolo?', '#QuestionWord #PastTense #Determiner #Noun'],
    ['Diga-me a verdade', '#Imperative #Reflexive #Determiner #Noun'],
    ['Talvez ela esteja em casa', '#Adverb #Pronoun #Subjunctive #Preposition #Noun'],
  ]
  arr.forEach(a => {
    let doc = nlp(a[0])
    t.equal(doc.has(a[1]), true, here + a[0])
  })
  t.end()
})

test('está is present-tense copula:', function (t) {
  let doc = nlp('o livro está na mesa')
  t.equal(doc.match('está').has('#PresentTense'), true, here + 'está #PresentTense')
  t.equal(doc.match('está').has('#Copula'), true, here + 'está #Copula')
  t.equal(doc.match('está').has('#Imperative'), false, here + 'está not #Imperative')
  t.end()
})

test('negation words are not verbs:', function (t) {
  let doc = nlp('não sei')
  t.equal(doc.match('não').has('#Negative'), true, here + 'não #Negative')
  t.equal(doc.match('não').has('#Verb'), false, here + 'não not #Verb')
  t.end()
})

test('clitic pronouns are not verbs:', function (t) {
  let doc = nlp('Eu me chamo Pedro')
  t.equal(doc.match('me').has('#Reflexive'), true, here + 'me #Reflexive')
  t.equal(doc.match('me').has('#Pronoun'), true, here + 'me #Pronoun')
  t.equal(doc.match('me').has('#Verb'), false, here + 'me not #Verb')
  t.end()
})

test('subjunctive forms:', function (t) {
  let arr = [
    // imperfect-subjunctive
    ['se eu falasse', 'falasse'],
    ['se ele pudesse', 'pudesse'],
    ['se nós tivéssemos', 'tivéssemos'],
    // future-subjunctive irregulars
    ['quando eu fizer', 'fizer'],
    ['se você quiser', 'quiser'],
    ['quando eles puderem', 'puderem'],
    ['se ela vier', 'vier'],
  ]
  arr.forEach(a => {
    let doc = nlp(a[0])
    t.equal(doc.match(a[1]).has('#Subjunctive'), true, here + `'${a[1]}' is #Subjunctive`)
  })
  t.end()
})

test('subjunctive-context:', function (t) {
  let arr = [
    'Espero que você fale comigo',
    'Quero que ele venha aqui',
    'Talvez ele não fale',
  ]
  arr.forEach(str => {
    let doc = nlp(str)
    t.equal(doc.has('#Subjunctive'), true, here + str)
  })
  t.end()
})

test('se-if conjunction:', function (t) {
  let doc = nlp('Se eu fosse rico')
  t.equal(doc.match('se').has('#Conjunction'), true, here + 'se #Conjunction')
  // reflexive-use unchanged
  doc = nlp('Ela se levantou cedo')
  t.equal(doc.match('se').has('#Reflexive'), true, here + 'se #Reflexive')
  t.end()
})

test('subjunctive conjugation api:', function (t) {
  let obj = nlp('falou').verbs().conjugate()[0]
  t.equal(obj.SubjunctiveImperfect.first, 'falasse', here + 'falasse')
  t.equal(obj.SubjunctiveImperfect.thirdPlural, 'falassem', here + 'falassem')
  t.equal(obj.SubjunctivePresent.first, 'fale', here + 'fale')
  t.equal(obj.SubjunctiveFuture.first, 'falar', here + 'falar')

  obj = nlp('fez').verbs().conjugate()[0]
  t.equal(obj.SubjunctiveFuture.first, 'fizer', here + 'fizer')
  t.equal(obj.SubjunctiveImperfect.first, 'fizesse', here + 'fizesse')
  t.end()
})

test('subjunctive root:', function (t) {
  let arr = [
    ['pudesse', '{poder}'],
    ['falasse', '{falar}'],
    ['tivesse', '{ter}'],
    ['fizer', '{fazer}'],
    ['quiser', '{querer}'],
  ]
  arr.forEach(a => {
    let doc = nlp(a[0])
    doc.compute('root')
    t.equal(doc.has(a[1]), true, here + `${a[0]} → ${a[1]}`)
  })
  t.end()
})

test('enclitic pronouns:', function (t) {
  let arr = [
    ['Quero vê-lo amanhã', 'vê'],
    ['Ela vai fazê-lo hoje', 'fazê'],
    ['Vou amá-la para sempre', 'amá'],
  ]
  arr.forEach(a => {
    let doc = nlp(a[0])
    t.equal(doc.match(a[1]).has('#Infinitive'), true, here + `'${a[1]}' is #Infinitive`)
  })
  t.end()
})

test('determiner-verb-noun:', function (t) {
  // words that are also rare verb-conjugations
  let arr = [
    ['essa fala foi boa', 'fala'],
    ['a professora chegou', 'professora'],
    ['o bolo caiu', 'bolo'],
  ]
  arr.forEach(a => {
    let doc = nlp(a[0])
    t.equal(doc.match(a[1]).has('#Noun'), true, here + `'${a[1]}' is #Noun`)
    t.equal(doc.match(a[1]).has('#Verb'), false, here + `'${a[1]}' not #Verb`)
  })
  t.end()
})

test('portuguese suffixes:', function (t) {
  // made-up / uncommon words, resolved by suffix alone
  let arr = [
    ['blabladade', '#Noun'],
    ['blablação', '#Noun'],
    ['blablamente', '#Adverb'],
    ['blablávamos', '#Imperfect'],
    ['blablando', '#Gerund'],
    ['blablaríamos', '#Verb'],
  ]
  arr.forEach(a => {
    let doc = nlp(a[0])
    t.equal(doc.has(a[1]), true, here + `${a[0]} is ${a[1]}`)
  })
  t.end()
})
