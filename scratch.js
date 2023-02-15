import nlp from './src/index.js'
nlp.verbose('tagger')

let str = ``
str = `cento e vinte e um`
let doc = nlp(str).debug()
console.log(doc.numbers().get())