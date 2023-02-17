import test from 'tape'
import nlp from './_lib.js'
let here = '[pt-match] '

test('match:', function (t) {
  let arr = [
    ['O rato comeu o queijo', '#Determiner #Noun #Verb #Determiner #Noun'],// ("The mouse ate the cheese")
    ['o carro é branco', '#Determiner #Noun #Copula #Adjective'],// ("the car is white")
    ['a casa é branca', '#Determiner #Noun #Copula #Adjective'],// ("the house is white").

    // ['Tens que aceitar os factos.', '#Modal que #Verb #Determiner #Noun'],
    // ['Eles querem ir comigo', '#Pronoun #Auxiliary #Verb #Pronoun'],
    // ['Eu vou para casa', '#Pronoun #Verb #Preposition #Noun'],//i'm going home

    // ['esta linda casa branca', '#Pronoun #Adjective #Noun #Adjective'],// ("this lovely white house")
    // ['este lindo carro branco', '#Pronoun #Adjective #Noun #Adjective'],// ("this lovely white car")
    // ['estas lindas aves brancas', '#Pronoun #Adjective #Noun #Adjective'],// ("these lovely white birds")
    // ['estes lindos gatos brancos', '#Pronoun #Adjective #Noun #Adjective'],// ("these lovely white cats")

    // ['Fui, apesar da loja estar fechada.', '#Verb #Preposition de la #Noun #Copula #Adjective'],//"I went, even though the shop was closed."
    ['queremos cantar', '#Verb #Infinitive'],//we want to sing
    ['cantar é bom', '#Noun #Copula #Adjective'],//singing is good
    // ['Estavam dormindo', '#Pronoun #Verb'],//they were sleeping
    // ['Estavam a dormir.', '#Pronoun #Auxiliary #Verb'],//they were sleeping
    // ['cantávamos', '#PastTense'],//"we were singing"
    ['cantaríamos', '#Conditional'],
    ['ele havia falado', '#Pronoun #Auxiliary #Verb'],//he had spoken
    // ['temos falado', '#Pronoun #Verb'],//we have been speaking
    ['ele vai cantar', '#Pronoun #Auxiliary #Verb'],
    // ['Tinham deixado aqui uma cadeira', ''],//    They had left a chair here

    ['O Artur está a comer o almoço.', '#Determiner #Person #Auxiliary #Auxiliary #Verb #Determiner #Noun'],//arthur is eating lunch
    // lexicon
    ['limpo', '#Adjective'],
    ['limpa', '#Adjective'],
    ['limpas', '#Adjective'],
    ['limpos', '#Adjective'],
    ['seis', '#Cardinal'],
    ['ho chi minh', '#City+'],
    ['possivelmente', '#Adverb'],
    ['desde', '#Preposition'],
    ['uma', '#Determiner'],
    ['estão', '#Copula'],
    // future tenses
    ['eu beberei o vinho', '#Pronoun #FutureTense #Determiner #Noun'],// i will drink wine
    ['Eu assistirei o filme.', '#Pronoun #FutureTense #Determiner #Noun'],
    ['Nós ganharemos o jogo.', '#Pronoun #FutureTense #Determiner #Noun'],
    // ir+infinitive
    ['eu vou beber o vinho', '#Pronoun #Auxiliary #Infinitive #Determiner #Noun'],// i will drink wine
    ['Eu vou assistir o filme.', '#Pronoun #Auxiliary #Infinitive #Determiner #Noun'],// 
    ['Nós vamos ganhar o jogo.', '#Pronoun #Auxiliary #Infinitive #Determiner #Noun'],// 
    // future-past
    ['ele chegaria ao jantar.', '#Pronoun #Conditional #Preposition #Determiner #Noun'],// he would make it to the dinner.
    ['eu ganharia mais dinheiro.', '#Pronoun #Conditional #Adverb #Noun'],// i would earn more money

    // dropped-s
    ['Nós lavamo-nos.', '#Pronoun #FirstPersonPlural #Reflexive'],
    ['Nós encontramo-nos', '#Pronoun #FirstPersonPlural #Reflexive'],
    ['Nós encontramos às quinze.', '#Pronoun #Verb #Preposition #Determiner #Value'],
    // reflexive
    ['Eles beijam-se.', '#Pronoun #Verb #Reflexive'],
    ['banhar-se', '#Infinitive #Reflexive'],
    ['Ele não se lavou', '#Pronoun #Negative #Reflexive #PastTense'],
    ['Quando é que ele se lavou?', '#QuestionWord #Verb #Conjunction #Pronoun #Reflexive #PastTense'],
    ['Nova Iorque é maior que São Paulo', '#City+ #Copula #Adjective #Conjunction #City+'],
    ['O vestido que você estava usando', '#Determiner #Noun #Conjunction #Pronoun #Auxiliary #Gerund'],
    ['Catarina poderia ter proposta', '#Noun #Modal #Auxiliary #Verb'],
    ['Posso fumar aqui?', '#Modal #Infinitive .'],//Can I smoke here?
    // ['Não podes fazer tudo o que queres.', ''], //You can’t do everything you want.
    // ['',''],
  ]
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str)//.compute('tagRank')
    let tags = doc.json()[0].terms.map(term => term.tags[0])
    let msg = `'${(str + "' ").padEnd(20, ' ')}  - '${tags.join(', ')}'`
    let m = doc.match(match)
    t.equal(m.text(), doc.text(), here + msg)
  })
  t.end()
})
