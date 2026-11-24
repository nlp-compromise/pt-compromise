import test from 'tape'
import nlp from '../_lib.js'
const here = '[pt-adjectives-hmm] '

test('adjectives conjugate:', function (t) {
  const arr = [
    // [male, female, plural, femalePlural]
    ['europeu', 'europeia', 'europeus', 'europeias'],
    // invariable
    ['simples', 'simples', 'simples', 'simples'],
    // -m has one form for both genders
    ['comum', 'comum', 'comuns', 'comuns'],
    ['ruim', 'ruim', 'ruins', 'ruins'],
    // stressed -il → -is
    ['gentil', 'gentil', 'gentis', 'gentis'],
    // -or comparatives have one form for both genders, but do take a plural
    ['melhor', 'melhor', 'melhores', 'melhores'],
    ['maior', 'maior', 'maiores', 'maiores'],
    ['superior', 'superior', 'superiores', 'superiores'],
    ['anterior', 'anterior', 'anteriores', 'anteriores'],
  ]
  arr.forEach(a => {
    const [male, female, plural, femalePlural] = a
    const res = nlp('ele é ' + male).adjectives().conjugate()
    t.deepEqual(res, [{ male, female, plural, femalePlural }], here + male)
  })
  t.end()
})
