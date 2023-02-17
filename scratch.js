import nlp from './src/index.js'
nlp.verbose('tagger')

let str = ``
str = `cantar é bom`
str = `ele havia falado`
str = `nos temos ido`
str = `Tinham deixado aqui uma cadeira`
str = `Tinham deixado`
str = `18,9 milhões`
str = `18 milhões`
str = `vigésimo primeiro`
let doc = nlp(str)


// console.log(doc.numbers().get())
// doc.numbers().add(2)
// doc.match('{ir}').debug()
// console.log(doc.verbs().conjugate()[0].Gerund)
doc.debug()