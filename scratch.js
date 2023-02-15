import nlp from './src/index.js'
nlp.verbose('tagger')

let str = ``
str = `noventa`
let doc = nlp(str).debug()
console.log(doc.numbers().get())