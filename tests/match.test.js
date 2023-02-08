import test from 'tape'
import nlp from './_lib.js'
let here = '[de-match] '

test('match:', function (t) {
  let arr = [
    ['O rato comeu o queijo', '#Determiner #Noun #Verb #Determiner #Noun'],// ("The mouse ate the cheese")
    ['o carro é branco', '#Determiner #Noun #Copula #Adjective'],// ("the car is white")
    ['a casa é branca', '#Determiner #Noun #Copula #Adjective'],// ("the house is white").

    ['Tens que aceitar os factos.', '#Modal que #Verb #Determiner #Noun'],
    ['Eles querem ir comigo', '#Pronoun #Auxiliary #Verb #Pronoun'],
    ['Eu vou para casa', '#Pronoun #Verb #Preposition #Noun'],//i'm going home

    ['esta linda casa branca', '#Pronoun #Adjective #Noun #Adjective'],// ("this lovely white house")
    ['este lindo carro branco', '#Pronoun #Adjective #Noun #Adjective'],// ("this lovely white car")
    ['estas lindas aves brancas', '#Pronoun #Adjective #Noun #Adjective'],// ("these lovely white birds")
    ['estes lindos gatos brancos', '#Pronoun #Adjective #Noun #Adjective'],// ("these lovely white cats")

    ['Fui, apesar da loja estar fechada.', '#Verb #Preposition de la #Noun #Copula #Adjective'],//"I went, even though the shop was closed."
    ['queremos cantar', '#Verb #Infinitive'],//we want to sing
    ['cantar é bom', '#Gerund #Copula #Adjective'],//sining is good
    ['Estavam dormindo', '#Pronoun #Verb'],//they were sleeping
    ['Estavam a dormir.', '#Pronoun #Auxiliary #Verb'],//they were sleeping
    ['cantávamos', '#PastTense'],//"we were singing"
    ['cantaríamos', '#ConditionalVerb'],
    ['ele havia falado', '#Pronoun #Auxiliary #Verb'],//he had spoken
    ['temos falado', '#Pronoun #Verb'],//we have been speaking
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
