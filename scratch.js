import nlp from './src/index.js'
nlp.verbose('tagger')
// nlp.verbose('tagger')

/*
*/


let arr = [
  'estamos',
  'Ouviram do Ipiranga as margens plácidas',
]
let txt = arr[0]

let doc = nlp(txt).debug()
// console.log(doc.verbs().conjugate()[0])