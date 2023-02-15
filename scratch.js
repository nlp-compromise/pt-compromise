import nlp from './src/index.js'
// nlp.verbose('tagger')

let str = ``
str = `-90`
let doc = nlp(str).debug()
console.log(doc.numbers().toText().text())