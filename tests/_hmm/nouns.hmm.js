import test from 'tape'
import nlp from '../_lib.js'
const here = '[pt-nouns-hmm] '

test('nouns toFeminine:', function (t) {
  const arr = [
    // the article should agree
    ['o senhor', 'a senhora'],
    // plural nouns stay plural
    ['os meninos', 'as meninas'],
    ['os professores', 'as professoras'],
    // irregular
    ['o avô', 'a avó'],
    ['o pai', 'a mãe'],
    ['o homem', 'a mulher'],
    ['o padrinho', 'a madrinha'],
    ['o padrasto', 'a madrasta'],
    ['o genro', 'a nora'],
    ['o cavalo', 'a égua'],
    ['o galo', 'a galinha'],
    ['o boi', 'a vaca'],
    ['o juiz', 'a juíza'],
    ['o deus', 'a deusa'],
    ['o duque', 'a duquesa'],
    ['o ateu', 'a ateia'],
    ['o frade', 'a freira'],
  ]
  arr.forEach(a => {
    const [str, want] = a
    const doc = nlp(str)
    doc.nouns().toFeminine()
    t.equal(doc.text(), want, here + `${str} → ${want}`)
  })
  t.end()
})

// an inanimate noun has no feminine form
test('nouns conjugate feminine:', function (t) {
  t.notEqual(nlp('o livro').nouns().conjugate()[0].feminine, 'livra', here + 'livro has no feminine')
  t.end()
})
