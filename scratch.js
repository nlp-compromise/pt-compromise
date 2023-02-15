import nlp from './src/index.js'
nlp.verbose('tagger')

let str = ``
str = `noventa e nove`
str = `vinte e uma`
str = `cento e vinte e um`
str = `quatrocentos e oitenta e sete`
str = `dois mil cincuenta e oito`
str = `dois milhões`
let doc = nlp(str).debug()
console.log(doc.numbers().json()[0])