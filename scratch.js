import nlp from './src/index.js'
nlp.verbose('tagger')

let str = ``
str = `cantar é bom`
str = `ele havia falado`
str = `nos temos ido`
str = 'Ele quer mostrar-me um desenho' // He wants to show me a drawing
str = 'Eles beijam-se'
str = 'Nós encontramos às quinze.'
// str = 'gesticularei'
// str = 'eu beberei o vinho'
// str = 'eu vou beber o vinho'
// str = 'beijar'
// str = `Tinham deixado aqui uma cadeira`
// str = `Tinham deixado`
let doc = nlp(str)
// doc.match('{ir}').debug()
// console.log(doc.verbs().conjugate())
doc.debug()