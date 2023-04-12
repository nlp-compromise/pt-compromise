import nlp from './src/index.js'
// nlp.verbose('tagger')
import one from '/Users/spencer/mountain/pt-compromise/data/models/plurals.js'

// let already = {}
// let tmp = one
// tmp = tmp.filter(a => {
//   if (already[a[0]]) {
//     return false
//   }
//   already[a[0]] = true
//   return true
// })
// console.log(JSON.stringify(tmp, null, 2))

let str = ``
str = `cantar é bom`
str = `ele havia falado`
str = `nos temos ido`
str = `Tinham deixado aqui uma cadeira`
str = `Tinham deixado`
str = `18,9 milhões`
str = `18 milhões`
str = `será sorteado`
str = `Heróis do mar, nobre povo,`
str = `Entre as brumas da memória,`
str = `Desfralda a invicta Bandeira,`
str = `O Oceano, a rugir d'amor,`
str = 'mãezinhas'
str = 'pesadas'
str = 'odiado'
str = 'nós fomos'
str = 'as lindas flores cresciam rapidamente'
// str = 'cresciam'
let doc = nlp(str).debug().compute('root')
console.log(doc.json()[0].terms)

// doc.match('#Determiner {linda} {flor} {crescer} #Adverb').debug()
// console.log(doc.nouns().toPlural().text())

// console.log(nlp('crescer').verbs().conjugate()[0])

// console.log(doc.numbers().get())
// doc.numbers().add(2)
// doc.match('{ir}').debug()
// console.log(doc.verbs().conjugate()[0].Gerund)
// doc.debug()