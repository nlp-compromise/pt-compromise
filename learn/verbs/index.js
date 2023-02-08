import data from './scrape/data.js'
let want = 'Futuro'
let out = {}
data.forEach(obj => {
  out[obj.word] = obj[want]
})

console.log(JSON.stringify(out, null, 2))