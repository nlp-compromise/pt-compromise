import nlp from './src/index.js'
// nlp.verbose('tagger')

let str = ``
str = `trinta`
let doc = nlp(str).numbers().toOrdinal().debug()
console.log(doc.text())