import nlp from './src/index.js'
nlp.verbose('tagger')

let str = ``
str = `cantar é bom`
str = `ele havia falado`
str = `nos temos ido`
// str = `Tinham deixado aqui uma cadeira`
// str = `Tinham deixado`
let doc = nlp(str)
// doc.match('{ir}').debug()
// console.log(doc.verbs().conjugate())
doc.debug()