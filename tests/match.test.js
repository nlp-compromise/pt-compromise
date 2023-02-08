import test from 'tape'
import nlp from './_lib.js'
let here = '[de-match] '

test('match:', function (t) {
  let arr = [
    // ['Tenho que ir embora.', ''],//i must leave now
    ['Tens que aceitar os factos.', '#Modal que #Verb #Determiner #Noun'],
    ['Eles querem ir comigo', '#Pronoun #Auxiliary #Verb #Pronoun'],
    ['Eu vou para casa', '#Pronoun #Verb #Preposition #Noun'],//i'm going home

    ['o carro é branco', '#Determiner #Noun #Copula #Adjective'],// ("the car is white")
    ['a casa é branca', '#Determiner #Noun #Copula #Adjective'],// ("the house is white").

    ['esta linda casa branca', '#Pronoun #Adjective #Noun #Adjective'],// ("this lovely white house")
    ['este lindo carro branco', '#Pronoun #Adjective #Noun #Adjective'],// ("this lovely white car")
    ['estas lindas aves brancas', '#Pronoun #Adjective #Noun #Adjective'],// ("these lovely white birds")
    ['estes lindos gatos brancos', '#Pronoun #Adjective #Noun #Adjective'],// ("these lovely white cats")

    ['Fui, apesar da loja estar fechada.', '#Verb #Preposition de la #Noun #Copula #Adjective'],//"I went, even though the shop was closed."
    // ['', ''],
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
