import nlp from './src/index.js'
// nlp.verbose('tagger')

/*
*/

console.log(Object.keys(nlp.world().model.one.lexicon).length.toLocaleString())

let arr = [
  'apalavrarmos',
  'Ouviram do Ipiranga as margens plácidas',
]
let txt = arr[0]

let doc = nlp(txt).debug()
// console.log(doc.verbs().conjugate()[0])