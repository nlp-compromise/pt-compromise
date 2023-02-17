import data from './scrape/data.js'
let want = 'Presente'
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

// console.log(JSON.stringify(out, null, 2))
