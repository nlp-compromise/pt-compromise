import nlp from './src/index.js'
nlp.verbose('tagger')

let str = ``
str = `ducentésimas`
let doc = nlp(str).debug()
console.log(doc.numbers().get())