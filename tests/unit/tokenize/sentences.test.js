import test from 'tape'
import nlp from '../../_lib.js'
const here = '[pt-sentences] '
nlp.verbose(false)

test('sentences:', function (t) {
  const arr = [
    // terminators
    ['Fui a Lisboa. Depois voltei.', ['Fui a Lisboa.', 'Depois voltei.']],
    ['Como estás? Muito bem! Obrigado.', ['Como estás?', 'Muito bem!', 'Obrigado.']],
    ['Que horas são? São três. Obrigado!', ['Que horas são?', 'São três.', 'Obrigado!']],
    ['A sério?! Não acredito.', ['A sério?!', 'Não acredito.']],
    ['Que lindo!!! A sério??', ['Que lindo!!!', 'A sério??']],
    ['Porquê? Porque não!', ['Porquê?', 'Porque não!']],
    ['Um. Dois. Três.', ['Um.', 'Dois.', 'Três.']],
    ['Sim. Não. Talvez.', ['Sim.', 'Não.', 'Talvez.']],
    ['Lisboa é a capital de Portugal. O Porto é maior?', ['Lisboa é a capital de Portugal.', 'O Porto é maior?']],
    ['Chegou na segunda-feira. Saiu na terça.', ['Chegou na segunda-feira.', 'Saiu na terça.']],
    // not terminators
    ['Eu gosto de café', ['Eu gosto de café']],
    ['Vi o Marco, o Lucas e a Ana.', ['Vi o Marco, o Lucas e a Ana.']],
    ['a cidade é bonita; o mar é azul.', ['a cidade é bonita; o mar é azul.']],
    ['Ele disse: venho amanhã.', ['Ele disse: venho amanhã.']],
    ['Marco – o meu amigo – está aqui.', ['Marco – o meu amigo – está aqui.']],
    // ellipses
    ['Chove... muito', ['Chove... muito']],
    ['Hum... não sei. Veremos.', ['Hum... não sei.', 'Veremos.']],
    // quotations + dialogue dashes
    ['«Vem cá!» disse a Maria. Depois saiu.', ['«Vem cá!» disse a Maria.', 'Depois saiu.']],
    ['«Onde vais?» perguntou o Lucas. «Para casa.»', ['«Onde vais?» perguntou o Lucas.', '«Para casa.»']],
    ['— Olá — disse ela. — Tudo bem?', ['— Olá — disse ela.', '— Tudo bem?']],
    // abbreviations
    ['O Sr. Silva chegou ontem.', ['O Sr. Silva chegou ontem.']],
    ['Sr. Silva, bom dia.', ['Sr. Silva, bom dia.']],
    ['O Dr. Lima está aqui.', ['O Dr. Lima está aqui.']],
    ['O Prof. Rui ensina aqui.', ['O Prof. Rui ensina aqui.']],
    ['O Eng. Nunes trabalha em Lisboa.', ['O Eng. Nunes trabalha em Lisboa.']],
    ['D. Pedro foi imperador.', ['D. Pedro foi imperador.']],
    ['Ex.: um gato.', ['Ex.: um gato.']],
    // abbreviated months + weekdays
    ['Nasceu em jan. de 1990.', ['Nasceu em jan. de 1990.']],
    ['Nasceu em 5 de set. de 1990.', ['Nasceu em 5 de set. de 1990.']],
    ['Reunião na seg. às 10h.', ['Reunião na seg. às 10h.']],
    // numbers
    ['Custa 3,50 euros. Eu compro.', ['Custa 3,50 euros.', 'Eu compro.']],
    ['Custa 3.50 euros. Tudo bem.', ['Custa 3.50 euros.', 'Tudo bem.']],
    ['Custa 1.000 euros por mês.', ['Custa 1.000 euros por mês.']],
    ['São 15h30. Vamos!', ['São 15h30.', 'Vamos!']],
    ['Nasceu em 1990. Vive em Lisboa.', ['Nasceu em 1990.', 'Vive em Lisboa.']],
    ['A versão 2.0.1 saiu. Baixa-a!', ['A versão 2.0.1 saiu.', 'Baixa-a!']],
    ['Mora na R. Augusta, n.º 5. É perto.', ['Mora na R. Augusta, n.º 5.', 'É perto.']],
    // urls + emails
    ['www.exemplo.pt é um site. Visita-o.', ['www.exemplo.pt é um site.', 'Visita-o.']],
    ['Escreve para maria@exemplo.pt hoje. Obrigado.', ['Escreve para maria@exemplo.pt hoje.', 'Obrigado.']],
    // newlines
    ['Olá!\n\nComo estás?', ['Olá!', 'Como estás?']],
    ['Lista de compras\nPão e leite', ['Lista de compras', 'Pão e leite']],
    // extra whitespace
    ['Olá   mundo.  Como  vai?', ['Olá   mundo.', 'Como  vai?']],
  ]
  arr.forEach(a => {
    const [str, want] = a
    const doc = nlp(str)
    t.deepEqual(doc.fullSentences().out('array'), want, here + JSON.stringify(str))
    t.equal(doc.text(), str, here + 'roundtrip ' + JSON.stringify(str))
  })
  t.end()
})

test('sentence api:', function (t) {
  const doc = nlp('Fui a Lisboa. Depois voltei? Sim!')
  t.equal(doc.length, 3, here + 'doc length')
  t.equal(doc.eq(1).text(), 'Depois voltei?', here + 'eq(1)')
  t.equal(doc.first().text(), 'Fui a Lisboa.', here + 'first()')
  t.equal(doc.last().text(), 'Sim!', here + 'last()')
  t.equal(doc.match('voltei').fullSentences().text(), 'Depois voltei?', here + 'fullSentences() of a match')
  t.equal(doc.if('lisboa').length, 1, here + 'if()')
  t.equal(doc.ifNo('lisboa').length, 2, here + 'ifNo()')
  t.deepEqual(doc.json().map(o => o.text), ['Fui a Lisboa.', 'Depois voltei?', 'Sim!'], here + 'json text')
  t.end()
})
