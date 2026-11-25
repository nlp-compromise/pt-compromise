import test from 'tape'
import nlp from '../../_lib.js'
const here = '[article-clitic] '
nlp.verbose(false)

// o / a / os / as are articles, and object-pronouns too - and 'a' is a preposition
// [word] is a verb, after its pronoun - {word} is a noun, after its article - <a> is a preposition
const clitics = [
  'eu a [vejo]',
  'não os [tenho]',
  'ele o [comprou]',
  'quem a [viu]?',
  'já as [li]',
  'que o [faça]',
  'eu o [vi] ontem',
  'não a [conheço]',
  'ela os [comprou] na {loja}',
  'nós as [vendemos]',
  'ele a [ama]',
  'você o [conhece]',
  'eles os [querem]',
  'nunca a [vi]',
  'não o [quero]',
  'não as [encontrei]',
  'eu os [vejo] todos os {dias}',
  'ela a [abre] com cuidado',
  'ele os [fecha] cada {noite}',
  'Maria o [comprou] ontem',
  'minha mãe a [cozinha] muito bem',
  'o {menino} o [quebrou]',
  'a {mulher} os [chama]',
  'o {professor} as [corrige]',
  'já o [entendo]',
  'também a [conheço]',
  'ainda os [tenho]',
  'sempre a [ajudo]',
  'quando o [vejo,] sorrio',
  'porque a [amo]',
  'quem os [vende]?',
  'onde as [compram]?',
  'se a [vires,] diz olá',
  'espero que o [encontres]',
  'quero que a [leia]',
  'disse que os [tinha]',
  'acho que a [conhece]',
  'talvez o [saiba]',
  'não a [toques]',
  'não o [compres]',
  'não os [percas]',
  'não as [abras]',
  'eu a [conto]',
  'ela o [sabe]',
  'ele as [vende]',
  'nós os [esperamos]',
  'eles a [procuram]',
  'tu o [queres]',
  'ninguém a [viu]',
  'alguém o [levou]',
  'tudo o [incomoda]',
  'isso a [preocupa]',
  'eu não a [vejo] há muito {tempo}',
  'ele nunca os [leu]',
  'quem o [disse]?',
  'como a [fazem]?',
  'já a [paguei]',
  'ainda não o [recebi]',
  'só a [vi] uma {vez}',
  'todos a [conhecem]',
  'eu a [trabalho] bem',
  'ela o [canta] muito bem',
  'ele a [conta] a todos',
  'não a [canto] mais',
  'eu o [jogo] fora',
  'não a [como]',
  'quem a [casa]?'
]

// a pronoun after its verb, or inside of it
const enclitics = [
  '[vejo]-a todos os {dias}',
  '[comprou]-os ontem',
  '[disse]-me a {verdade}',
  '[vê]-lo é um {prazer}',
  '[dir]-lhe-ei a {verdade}',
  '[dar]-te-ei o {livro}',
  '[lavamo]-nos',
  '[fazê]-lo',
  '[dão]-no',
  '[chamo]-me Pedro',
  '[deu]-lhe um {livro}',
  '[viu]-as na {rua}'
]

const articles = [
  'a {casa} é grande',
  'o {livro} está na {mesa}',
  'os {meninos} brincam',
  'as {meninas} cantam',
  'a {conta} é alta',
  'o {trabalho} é difícil',
  'a {festa} foi boa',
  'o {jogo} começou',
  'a {planta} cresceu',
  'a {forma} é redonda',
  'a {fábrica} fechou',
  'o {gosto} é bom',
  'a {cozinha} é pequena',
  'as {compras} estão caras',
  'a {venda} da {casa}',
  'o {canto} dos {pássaros}',
  'a {mulher} chegou',
  'os {homens} trabalham',
  'as {flores} são bonitas',
  'a {luz} apagou',
  'comprei o {livro}',
  'vendi a {casa}',
  'tenho os {livros}',
  'vejo as {estrelas}',
  'abri a {porta}',
  'fechei a {janela}',
  'paguei a {conta}',
  'perdi o {jogo}',
  'gosto da {música}',
  'moro na {cidade}',
  'venho do {trabalho}',
  'falo dos {problemas}',
  'passei pela {ponte}',
  'vou pelo {caminho}',
  'estou no {jardim}',
  'ele está nas {montanhas}',
  'os {livros} do {menino}',
  'a {casa} da {menina}',
  'um {livro} e uma {caneta}',
  'uns {amigos} e umas {amigas}',
  'o {professor} e os {alunos}',
  'a {porta} e a {janela}',
  'o {pai} e a {mãe}',
  'o {cão} e o {gato}',
  'a {mesa} da {cozinha}',
  'a {história} do {país}',
  'o {fim} da {viagem}',
  'as {ruas} da {cidade}',
  'os {olhos} da {menina}',
  'a {cor} do {carro}',
  'a {mão} do {homem}',
  'o {nome} da {rua}',
  'que a {casa} é grande',
  'acho que o {livro} é bom',
  'quando a {festa} acabou',
  'se o {trabalho} é difícil',
  'a {compra} foi cara',
  'a {conta} do {restaurante}',
  'o {almoço} está pronto',
  'a {dança} começou',
  'a {viagem} foi longa',
  'o {jantar} está na {mesa}',
  'a {pergunta} é difícil',
  'a {resposta} está certa',
  'os {jovens} chegaram',
  'num {dia} de {sol}',
  'dum {amigo} meu',
  'os {parabéns}',
  'a {escola} fica longe',
  'que a {paz} esteja convosco'
]

const prepositions = [
  'vou <a> Lisboa',
  'dei o {livro} <a> Maria',
  'começou <a> chover',
  'fui <a> pé',
  '<a> partir de hoje',
  'cheguei <a> tempo',
  'daqui <a> pouco',
  'escrevi <a> ela',
  'daqui <a> Lisboa',
  'obrigado <a> todos'
]

const want = { '[': 'Verb', '{': 'Noun', '<': 'Preposition' }
const clean = (str) => str.replace(/[,.?!]/g, '').toLowerCase()

// each marked word, and the word before it
const parse = function (str) {
  const text = str.replace(/[[\]{}<>]/g, '')
  const terms = nlp(text).json()[0].terms
  const out = []
  let n = 0
  for (const m of str.matchAll(/([[{<])([^\]}>]+)/g)) {
    while (terms[n] && clean(terms[n].text) !== clean(m[2])) {
      n += 1
    }
    out.push({ tag: want[m[1]], term: terms[n] || { tags: [] }, before: terms[n - 1] || { tags: [], text: '' } })
    n += 1
  }
  return { text, out }
}

const run = function (t, list) {
  list.forEach((str) => {
    const { text, out } = parse(str)
    out.forEach((o) => {
      t.ok(o.term.tags.includes(o.tag), here + `'${text}' - ${o.term.text} is a ${o.tag}`)
      if (/^(o|a|os|as)$/i.test(o.before.text) && o.tag !== 'Preposition') {
        const tag = o.tag === 'Verb' ? 'Pronoun' : 'Determiner'
        t.ok(o.before.tags.includes(tag), here + `'${text}' - ${o.before.text} is a ${tag}`)
      }
    })
  })
}

test('clitic + verb:', function (t) {
  run(t, clitics)
  t.end()
})

test('verb + clitic:', function (t) {
  run(t, enclitics)
  t.ok(nlp('vejo-a todos os dias').has('^#Verb #Pronoun'), here + 'vejo-a')
  t.ok(nlp('comprou-os').has('^#Verb #Pronoun$'), here + 'comprou-os')
  t.ok(nlp('dir-lhe-ei a verdade').has('#Determiner #Noun$'), here + 'dir-lhe-ei a verdade')
  t.end()
})

test('article + noun:', function (t) {
  run(t, articles)
  t.end()
})

test('a + noun:', function (t) {
  run(t, prepositions)
  t.end()
})

test('article-clitic misc:', function (t) {
  // an object-pronoun does not begin a sentence
  t.ok(nlp('o canto').has('^#Determiner #Noun$'), here + 'o canto')
  t.ok(nlp('a mente').has('^#Determiner #Noun$'), here + 'a mente')
  t.ok(nlp('os portais').has('^#Determiner #Plural$'), here + 'os portais')
  // .. or follow a preposition, or a verb
  t.ok(nlp('falo do trabalho').has('#Noun$'), here + 'do trabalho')
  t.ok(nlp('paguei a conta').has('#Determiner #Noun$'), here + 'paguei a conta')
  // a subjunctive wants its 'que'
  t.ok(nlp('o corte').has('#Determiner #Noun'), here + 'o corte')
  t.ok(nlp('não o corte').has('#Pronoun #Verb'), here + 'não o corte')
  t.ok(nlp('acho que a conta é alta').has('#Determiner #Noun #Copula'), here + 'que a conta é')
  // masculine nouns in '-a', and feminine nouns in '-o'
  t.ok(nlp('quando o programa começou').has('#Determiner #Noun'), here + 'o programa')
  t.ok(nlp('quando o ama').has('#Pronoun #Verb'), here + 'o ama')
  // number + gender
  t.ok(nlp('já os compras').has('#Pronoun #Verb'), here + 'já os compras')
  t.ok(nlp('ele as tem').has('#Pronoun #Verb'), here + 'ele as tem')
  t.ok(nlp('todos os dias').has('#Determiner #Plural$'), here + 'todos os dias')
  t.ok(nlp('todos a conhecem').has('#Pronoun #Verb$'), here + 'todos a conhecem')
  // a subject, and no verb yet
  t.ok(nlp('a Maria o conhece').has('#Pronoun #Verb$'), here + 'a Maria o conhece')
  t.ok(nlp('depois da festa a casa ficou suja').has('#Determiner casa'), here + 'depois da festa a casa')
  t.ok(nlp('levei o carro a casa').match('casa').has('#Noun'), here + 'levei o carro a casa')
  // un / uma, possessives and demonstratives are never pronouns
  t.ok(nlp('um canto').has('#Determiner #Noun'), here + 'um canto')
  t.ok(nlp('minha conta').has('#Possessive #Noun'), here + 'minha conta')
  t.ok(nlp('este trabalho').has('este #Noun'), here + 'este trabalho')
  // an adjective is a noun, with nothing after it
  t.ok(nlp('os jovens chegaram').has('^os #Plural #Verb'), here + 'os jovens chegaram')
  t.ok(nlp('ele é o melhor').has('#Determiner #Noun$'), here + 'o melhor')
  t.ok(nlp('a melhor aluna').has('#Determiner #Adjective #Noun'), here + 'a melhor aluna')
  // an infinitive, or a participle
  t.ok(nlp('o jantar').has('#Determiner #Noun'), here + 'o jantar')
  t.ok(nlp('os poderes').has('#Determiner #Plural'), here + 'os poderes')
  t.ok(nlp('o namorado').has('#Determiner #Noun'), here + 'o namorado')
  t.ok(nlp('começou a chover').has('#Preposition #Infinitive$'), here + 'a chover')
  // words that are an adverb, or a pronoun, first
  t.ok(nlp('a tarde').has('#Determiner #Noun'), here + 'a tarde')
  t.ok(nlp('chegou tarde').has('#Adverb$'), here + 'chegou tarde')
  t.ok(nlp('os nós').has('#Determiner #Plural'), here + 'os nós')
  // names keep their capital letter
  t.ok(nlp('a Rosa').has('#Person'), here + 'a Rosa')
  t.end()
})
