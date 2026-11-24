import test from 'tape'
import nlp from '../_lib.js'
const here = '[pt-sentences-hmm] '

// portuguese abbreviations should not end a sentence
test('abbreviations:', function (t) {
  const arr = [
    'A Sra. Costa chegou ontem.',
    'A Dra. Ana está aqui.',
    'Falei com a Profa. Ana ontem.',
    'Mora na Av. Paulista.',
    'Ver pág. 5 do livro.',
    'V. Exa. tem razão.',
  ]
  arr.forEach(str => {
    t.deepEqual(nlp(str).fullSentences().out('array'), [str], here + str)
  })
  t.end()
})

// a new capitalised sentence after 'etc.', an ellipsis, or a closed quotation
test('etc, ellipsis and quotes:', function (t) {
  const arr = [
    ['Comprou pão, leite, etc. Depois voltou para casa.', ['Comprou pão, leite, etc.', 'Depois voltou para casa.']],
    ['Espera… Já vou.', ['Espera…', 'Já vou.']],
    ['Não sei... Talvez amanhã.', ['Não sei...', 'Talvez amanhã.']],
    ['Ele disse: "Não sei." Depois saiu.', ['Ele disse: "Não sei."', 'Depois saiu.']],
    ['(Não sei.) Talvez amanhã.', ['(Não sei.)', 'Talvez amanhã.']],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.deepEqual(nlp(str).fullSentences().out('array'), want, here + str)
  })
  t.end()
})
