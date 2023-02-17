import getData from './getData.js'
import nlp from '../../src/index.js'

const green = str => '\x1b[32m' + str + '\x1b[0m'
const red = str => '\x1b[31m' + str + '\x1b[0m'

let bads = []
let rights = 0

const skipWords = {
  se: true,
  // a: true,
  // não: true
}

const topk = function (arr) {
  let obj = {}
  arr.forEach(a => {
    obj[a] = obj[a] || 0
    obj[a] += 1
  })
  let res = Object.keys(obj).map(k => [k, obj[k]])
  return res.sort((a, b) => (a[1] > b[1] ? -1 : 0))
}
const percent = (part, total) => {
  let num = (part / total) * 100;
  num = Math.round(num * 10) / 10;
  return num;
};

const doOne = function (obj) {
  let doc = nlp(obj.txt)
  let right = 0
  let wrong = 0
  let out = ''
  let print = false
  obj.words.forEach(o => {
    let m = doc.match(o.word.toLowerCase())
    if (!m.found) {
      return
    }
    if (m.has(`#${o.tag}`)) {
      rights += 1
      out += green(o.word) + ' '
    } else {
      wrong += 1
      out += red(o.word) + ' '
      // if (o.tag === 'Conjunction') {
      bads.push(o.word.toLowerCase())
      // }
      if (skipWords[o.word]) {
        print = true
        // console.log(o)
      }
    }
  })
  if (print && wrong > 0) {
    // doc.debug()
    // console.log(out)
    // console.log(obj)
  } else {
    // console.log('✅')
  }
}

let docs = getData()
docs.forEach(doOne)
console.log(topk(bads))


console.log(percent(rights, rights + bads.length) + '%')
// console.log(doOne(docs[441]))

