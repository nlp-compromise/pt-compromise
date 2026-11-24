import test from 'tape'
import nlp from '../../_lib.js'
const here = '[pt-tokenize] '
nlp.verbose(false)

test('sentence-splitting:', function (t) {
  const arr = [
    ['Fui a Lisboa. Depois voltei.', 2],
    ['Como estás? Muito bem! Obrigado.', 3],
    ['Olá.', 1],
    ['Eu gosto de café', 1],
    ['', 0],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.equal(nlp(str).fullSentences().length, want, here + `'${str}' → ${want} sentences`)
  })
  t.end()
})

test('term-splitting:', function (t) {
  const arr = [
    ['Eu gosto de café', ['Eu', 'gosto', 'de', 'café']],
    ['no dia 25 de abril de 1974', ['no', 'dia', '25', 'de', 'abril', 'de', '1974']],
    ['escreve para maria@exemplo.pt hoje', ['escreve', 'para', 'maria@exemplo.pt', 'hoje']],
    ['visita www.exemplo.pt hoje', ['visita', 'www.exemplo.pt', 'hoje']],
    ['Olá\tmundo', ['Olá', 'mundo']],
    ['Olá   mundo', ['Olá', 'mundo']],
    // a contraction stays in one piece
    ['Gosto do livro da Maria', ['Gosto', 'do', 'livro', 'da', 'Maria']],
    ['vamos pra praia', ['vamos', 'pra', 'praia']],
    [`copo d'água`, ['copo', `d'água`]],
    // a hyphen splits the word, and stays on the left side
    ['disse-me', ['disse-', 'me']],
    ['Ele disse-me a verdade', ['Ele', 'disse-', 'me', 'a', 'verdade']],
    ['Vou dar-lhe o livro', ['Vou', 'dar-', 'lhe', 'o', 'livro']],
    ['dar-te-ei um presente', ['dar-', 'te-', 'ei', 'um', 'presente']],
    ['O guarda-chuva é azul', ['O', 'guarda-', 'chuva', 'é', 'azul']],
    ['segunda-feira', ['segunda-', 'feira']],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.deepEqual(nlp(str).terms().out('array'), want, here + str)
  })
  t.end()
})

test('word-count:', function (t) {
  const arr = [
    ['olá', 1],
    ['Eu gosto de café', 4],
    ['Como estás? Muito bem! Obrigado.', 5],
    // a contraction counts once
    ['Gosto do livro da Maria', 5],
    ['Ela está na casa dele.', 5],
    [`um copo d'água`, 3],
    // each side of a hyphen counts
    ['disse-me', 2],
    ['dar-te-ei um presente', 5],
    ['', 0],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.equal(nlp(str).wordCount(), want, here + `'${str}' has ${want} words`)
  })
  t.end()
})

test('punctuation in pre/post:', function (t) {
  const arr = [
    // [text, [pre, text, post] for each term]
    ['um café, por favor!', [['', 'um', ' '], ['', 'café', ', '], ['', 'por', ' '], ['', 'favor', '!']]],
    ['«Vem cá!»', [['«', 'Vem', ' '], ['', 'cá', '!»']]],
    ['“Vem cá”, disse.', [['“', 'Vem', ' '], ['', 'cá', '”, '], ['', 'disse', '.']]],
    ['(talvez) amanhã', [['(', 'talvez', ') '], ['', 'amanhã', '']]],
    ['Chove... muito', [['', 'Chove', '... '], ['', 'muito', '']]],
    ['Que lindo!!!', [['', 'Que', ' '], ['', 'lindo', '!!!']]],
    // dashes between words are whitespace, not terms
    ['Marco – o meu amigo', [['', 'Marco', ' – '], ['', 'o', ' '], ['', 'meu', ' '], ['', 'amigo', '']]],
    ['Marco - o meu amigo', [['', 'Marco', ' - '], ['', 'o', ' '], ['', 'meu', ' '], ['', 'amigo', '']]],
    ['— Olá — disse ela.', [['— ', 'Olá', ' — '], ['', 'disse', ' '], ['', 'ela', '.']]],
    // the hyphen of a clitic is in the post
    ['disse-me', [['', 'disse', '-'], ['', 'me', '']]],
    ['  Olá mundo  ', [['  ', 'Olá', ' '], ['', 'mundo', '  ']]],
  ]
  arr.forEach(a => {
    const [str, want] = a
    const have = nlp(str).docs[0].map(term => [term.pre, term.text, term.post])
    t.deepEqual(have, want, here + str)
  })
  t.end()
})

test('numbers are one term:', function (t) {
  const arr = [
    ['Custa 3,50 euros', ['Custa', '3,50', 'euros']],
    ['Custa 1.000 euros por mês', ['Custa', '1.000', 'euros', 'por', 'mês']],
    ['Custa 1.234,56 euros', ['Custa', '1.234,56', 'euros']],
    ['chega às 8:30 amanhã', ['chega', 'às', '8:30', 'amanhã']],
    ['às 15h30 de hoje', ['às', '15h30', 'de', 'hoje']],
    ['50% dos alunos', ['50%', 'dos', 'alunos']],
    ['o 1.º lugar', ['o', '1.º', 'lugar']],
    ['o 2º lugar', ['o', '2º', 'lugar']],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.deepEqual(nlp(str).terms().out('array'), want, here + str)
  })
  t.end()
})

test('normalized text:', function (t) {
  const arr = [
    // lowercased, but the accents are kept
    ['Não SEI porquê!', 'não sei porquê!'],
    ['A AÇÃO é rápida.', 'a ação é rápida.'],
    ['Marco, Lucas e Ana', 'marco lucas e ana'],
    ['guarda-chuva', 'guarda chuva'],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.equal(nlp(str).text('normal'), want, here + str)
  })
  t.equal(nlp('ação').docs[0][0].normal, 'ação', here + 'accents kept in normal')
  t.equal(nlp('Não').docs[0][0].normal, 'não', here + 'lowercase in normal')
  t.end()
})

test('match ignores case and punctuation:', function (t) {
  t.equal(nlp('Ele disse "olá" e saiu').match('olá').text(), 'olá', here + 'inside quotes')
  t.equal(nlp('«Vem cá!» disse a Maria.').match('cá').text(), 'cá', here + 'inside guillemets')
  t.equal(nlp('CAFÉ, por favor!').has('café por favor'), true, here + 'case and comma')
  t.equal(nlp('o cafe').has('café'), false, here + 'accent is significant')
  t.equal(nlp('disse-me a verdade').has('disse me'), true, here + 'across a hyphen')
  t.equal(nlp('disse-me a verdade').match('me').text(), 'me', here + 'the clitic alone')
  t.end()
})

test('text-roundtrip:', function (t) {
  const arr = [
    'Como estás?',
    'Que surpresa!',
    'Fui a Lisboa. Depois voltei.',
    '  Olá mundo  ',
    'Olá   mundo.  Como  vai?',
    'Olá,\nmundo.\nComo vai?',
    'Olá!\n\nComo estás?',
    'Olá\tmundo',
    '«Vem cá!» disse a Maria. Depois saiu.',
    '“Vem cá”, disse.',
    'Ele disse: "Não sei." Depois saiu.',
    'Chove... muito',
    'Espera… Já vou.',
    'Marco – o meu amigo – está aqui.',
    '— Olá — disse ela. — Tudo bem?',
    '(talvez) amanhã',
    'Custa 1.234,56 euros por mês.',
    'Gosto do livro da Maria.',
    'Ela está na casa dele.',
    `um copo d'água, por favor`,
    'Ele disse-me a verdade.',
    'dar-te-ei um presente',
    'Chegou na segunda-feira. Saiu na terça.',
    'Porquê? Porque não!',
  ]
  arr.forEach(str => {
    t.equal(nlp(str).text(), str, here + `roundtrip '${str}'`)
  })
  t.end()
})

test('nlp.tokenize:', function (t) {
  const str = 'O gato come. O cachorro dorme!'
  const doc = nlp.tokenize(str)
  t.equal(doc.length, 2, here + 'two sentences')
  t.equal(doc.wordCount(), 6, here + 'six words')
  t.equal(doc.text(), str, here + 'tokenize roundtrip')
  t.deepEqual(doc.terms().out('array'), nlp(str).terms().out('array'), here + 'same terms as nlp()')
  t.equal(doc.has('#Noun'), false, here + 'no tagger was run')
  t.equal(doc.has('gato'), true, here + 'words still match')
  t.end()
})
