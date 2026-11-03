import data from './scrape/data3.js'
const want = 'Infinitivo Pessoal'
const out = {}
data.forEach(obj => {
  out[obj.word] = obj[want]
})

// console.log(JSON.stringify(out, null, 2))

// import data from './scrape/data2.js'
// let want = 1
// let out = {}
// data.forEach(obj => {
//   out[obj.word] = obj.arr[want]
// })

console.log(JSON.stringify(out, null, 2))
