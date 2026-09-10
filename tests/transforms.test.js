import test from 'tape'
import nlp from './_lib.js'
let here = '[transforms] '

test('compound tenses:', function (t) {
  let doc = nlp('Eu tenho falado com ela')
  t.equal(doc.has('#PerfectTense'), true, here + 'tenho falado #PerfectTense')
  t.equal(doc.match('tenho').has('#Auxiliary'), true, here + 'tenho #Auxiliary')

  doc = nlp('Ela tinha saído quando cheguei')
  t.equal(doc.has('#Pluperfect'), true, here + 'tinha saído #Pluperfect')
  t.equal(doc.match('tinha').has('#Auxiliary'), true, here + 'tinha #Auxiliary')

  doc = nlp('ele havia falado')
  t.equal(doc.has('#Pluperfect'), true, here + 'havia falado #Pluperfect')

  doc = nlp('Nós teríamos ganhado o jogo')
  t.equal(doc.has('#PerfectTense'), true, here + 'teríamos ganhado #PerfectTense')
  t.end()
})

test('verb transforms:', function (t) {
  let arr = [
    ['eu falei com ela', 'toPresentTense', 'eu falo com ela'],
    ['ela come pão', 'toPastTense', 'ela comeu pão'],
    ['nós falamos', 'toFutureTense', 'nós falaremos'],
    ['eu vou beber o vinho', 'toPastTense', 'eu bebi o vinho'],
    ['eu tenho falado', 'toPastTense', 'eu falei'],
    ['tu cantas bem', 'toPastTense', 'tu cantaste bem'],
    ['você falava', 'toPresentTense', 'você fala'],
    ['falei', 'toInfinitive', 'falar'],
    ['ela fala', 'toGerund', 'ela falando'],
    ['eles compraram um carro', 'toImperfect', 'eles compravam um carro'],
    ['eu falo', 'toConditional', 'eu falaria'],
  ]
  arr.forEach(a => {
    let doc = nlp(a[0])
    doc.verbs()[a[1]]()
    t.equal(doc.text(), a[2], here + `${a[0]} → ${a[2]}`)
  })
  t.end()
})

test('noun gender:', function (t) {
  let doc = nlp('a professora')
  t.equal(doc.match('professora').has('#FemaleNoun'), true, here + 'professora #FemaleNoun')

  let obj = nlp('o professor').nouns().conjugate()[0]
  t.equal(obj.feminine, 'professora', here + 'conjugate feminine')

  doc = nlp('o professor')
  doc.nouns().toFeminine()
  t.equal(doc.text(), 'a professora', here + 'toFeminine with determiner')

  // roots
  let arr = [
    ['as professoras', '{professor}'],
    ['a atriz', '{ator}'],
    ['a menina', '{menino}'],
  ]
  arr.forEach(a => {
    let d = nlp(a[0])
    d.compute('root')
    t.equal(d.has(a[1]), true, here + `${a[0]} → ${a[1]}`)
  })

  // abstract -or nouns have no feminine
  doc = nlp('o amor é lindo')
  t.equal(doc.match('amor').has('#FemaleNoun'), false, here + 'amor not #FemaleNoun')
  t.end()
})

test('mesoclisis:', function (t) {
  let doc = nlp('dar-te-ei o livro')
  t.equal(doc.match('dar').has('#FutureTense'), true, here + 'dar-te-ei #FutureTense')
  t.equal(doc.match('te').has('#Reflexive'), true, here + 'te #Reflexive')

  doc = nlp('Dir-se-ia que é verdade')
  t.equal(doc.match('dir').has('#Conditional'), true, here + 'dir-se-ia #Conditional')
  t.end()
})

test('clitic allomorphs:', function (t) {
  // 'dão-no' is dão + o, not 'em o'
  let doc = nlp('Eles dão-no ao pai')
  t.equal(doc.match('no').has('#Reflexive'), true, here + 'dão-no clitic')
  t.equal(doc.match('no').has('#Preposition'), false, here + 'dão-no not em+o')
  t.end()
})

test('accusative clitics:', function (t) {
  let doc = nlp('Eu o vi ontem')
  t.equal(doc.match('o').has('#Pronoun'), true, here + 'eu o vi - clitic')
  t.equal(doc.match('o').has('#Determiner'), false, here + 'o not #Determiner')

  doc = nlp('não a conheço')
  t.equal(doc.match('a').has('#Pronoun'), true, here + 'não a conheço - clitic')
  t.end()
})
