import data from './scrape/data3.js'
let want = 'Infinitivo Pessoal'
let out = {}
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
