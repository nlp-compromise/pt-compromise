import getData from './getData.js'
import nlp from '../../src/index.js'

const green = str => '\x1b[32m' + str + '\x1b[0m'
const red = str => '\x1b[31m' + str + '\x1b[0m'

const bads = []
let rights = 0

const skipWords = {
  se: true,
  // we handle contractions differently
  da: true,
  aa: true,
  a: true,
  // considered a verb-phrase
  não: true
}

const topk = function (arr) {
  const obj = {}
  arr.forEach(a => {
    obj[a] = obj[a] || 0
    obj[a] += 1
  })
  const res = Object.keys(obj).map(k => [k, obj[k]])
  return res.sort((a, b) => (a[1] > b[1] ? -1 : 0))
}
const percent = (part, total) => {
  let num = (part / total) * 100;
  num = Math.round(num * 10) / 10;
  return num;
};

const doOne = function (obj) {
  const doc = nlp(obj.txt)
  const right = 0
  let wrong = 0
  let out = ''
  let print = false
  obj.words.forEach(o => {
    const m = doc.match(o.word.toLowerCase())
    if (!m.found) {
      return
    }
    if (m.has(`#${o.tag}`)) {
      rights += 1
      out += green(o.word) + ' '
    } else {
      wrong += 1
      out += red(o.word) + ' '
      if (o.word === 'que') {
        print = true

      }
      if (!skipWords[o.word]) {
        bads.push(o.word.toLowerCase())
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

const docs = getData()
docs.forEach(doOne)
console.log(topk(bads))


console.log(percent(rights, rights + bads.length) + '%')
// console.log(doOne(docs[441]))

