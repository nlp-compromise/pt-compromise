import test from 'tape'
import nlp from '../_lib.js'
const here = '[pt-numbers-hmm] '

const run = function (str, fn) {
  const doc = nlp(str)
  fn(doc.numbers())
  return doc.text()
}

// a number takes the gender of its noun - but the tagger only knows the gender of people ('menina', 'professora')
// - 'casa', 'vez' and 'noite' have no gender tag, so the number stays masculine
test('gender of the counted noun:', function (t) {
  const arr = [
    ['tenho 21 casas', 'tenho vinte e uma casas'],
    ['há 200 pessoas', 'há duzentas pessoas'],
    ['1001 noites', 'mil e uma noites'],
    ['tenho 2 casas', 'tenho duas casas'],
    ['há 500000 pessoas', 'há quinhentas mil pessoas'],
  ]
  arr.forEach(a => {
    t.equal(run(a[0], m => m.toText()), a[1], here + a[0])
  })
  // and the gender that was written is lost, by way of a word that has none
  t.equal(run('duzentas casas', m => m.toNumber().toText()), 'duzentas casas', here + 'duzentas, both ways')
  t.equal(run('a terceira vez', m => m.toCardinal().toOrdinal()), 'a terceira vez', here + 'terceira, both ways')
  t.end()
})

// the noun does not follow its number
test('number of the counted noun:', function (t) {
  t.equal(run('tenho 1 gato', m => m.add(1)), 'tenho 2 gatos', here + '1 gato + 1')
  t.equal(run('1 casa', m => m.add(1)), '2 casas', here + '1 casa + 1')
  t.equal(run('dois gatos', m => m.set(1)), 'um gato', here + 'dois gatos = 1')
  t.end()
})

// a decimal has words - 'três vírgula cinco' is read, but it is not written
test('decimals in words:', function (t) {
  t.equal(run('3,5', m => m.toText()), 'três vírgula cinco', here + '3,5 toText')
  t.equal(run('três vírgula cinco', m => m.add(1)), 'quatro vírgula cinco', here + 'três vírgula cinco + 1')
  t.equal(run('dois e meio', m => m.toNumber()), '2,5', here + 'dois e meio toNumber')
  t.equal(run('três quartos', m => m.toNumber()), '0,75', here + 'três quartos toNumber')
  t.end()
})

// a range is three terms - '3', 'to' and '4' - and only the first one is read
test('number ranges:', function (t) {
  t.deepEqual(nlp('3-4').numbers().get(), [3, 4], here + '3-4')
  t.end()
})

// one word at a time - a second 'milhões' is not looked-ahead for
test('two numbers with the same multiple:', function (t) {
  t.deepEqual(nlp('dois milhões três milhões').numbers().get(), [2e6, 3e6], here + 'dois milhões três milhões')
  t.deepEqual(nlp('dois mil e três mil').numbers().get(), [2000, 3000], here + 'dois mil e três mil')
  t.end()
})

// the string argument of .set() is javascript's - '1.000' is 1, though the text '1.000' is a thousand
test('grouped digits as an argument:', function (t) {
  t.equal(run('5', m => m.set('1.000')), '1000', here + `set('1.000')`)
  t.end()
})

// these words are a noun first - 'um quarto' is a room, 'a metade' has an article, and 'o quarto' is tagged a noun
// before anything else is looked at - so that 'o quarto andar' is not a number at all
test('fractions that are nouns:', function (t) {
  t.deepEqual(nlp('um quarto de litro').numbers().get(), [0.25], here + 'um quarto de litro')
  t.deepEqual(nlp('a metade').numbers().get(), [0.5], here + 'a metade')
  t.deepEqual(nlp('metade dos alunos').numbers().get(), [0.5], here + 'metade dos')
  t.deepEqual(nlp('mora no quarto andar').numbers().get(), [4], here + 'o quarto andar')
  t.end()
})

// 'meia' is also slang for six, in a phone number - it is only read as a half
test('meia is six:', function (t) {
  t.deepEqual(nlp('três meia cinco').numbers().get(), [3, 6, 5], here + 'três meia cinco')
  t.end()
})

// the long scale of portugal - 'um bilião' is a million millions there, and is not read at all
test('european long scale:', function (t) {
  t.deepEqual(nlp('um bilião').numbers().get(), [1e12], here + 'um bilião')
  t.end()
})

// 'menos' is 'fewer', as well as 'minus'
test('menos as a comparison:', function (t) {
  t.deepEqual(nlp('tem menos cinco anos que eu').numbers().get(), [5], here + 'menos cinco anos que')
  t.end()
})
