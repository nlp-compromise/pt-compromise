import nlp from './src/index.js'
nlp.verbose('tagger')

let str = ``
str = `cantar é bom`
str = `O Artur está a comer o almoço.`
str = `Tinham deixado aqui uma cadeira`
str = `Tinham deixado`
let doc = nlp(str)
// console.log(doc.verbs().conjugate())
doc.debug()