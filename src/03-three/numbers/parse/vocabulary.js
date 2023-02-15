import data from '../data.js'

let toNumber = {}
let toCardinal = {}
let multiples = {
  'cem': 100,
  'centésimo': 100,
  'mil': 1000,
  'milésimo': 1000,
  'milhão': 1000000,
  'milionésimo': 1000000,
  'bilhão': 1000000000,
  'bilionésimo': 1000000000,
}

data.ones.concat(data.tens, data.teens, data.multiples).forEach(a => {
  toNumber[a[1]] = a[0] //cardinal
  if (a[2]) {
    toNumber[a[2]] = a[0]//ord
  }
})

// extras
Object.assign(toNumber, {
  uma: 1,
  duas: 2,
  dezasseis: 16,
  dezessete: 17,
  dezenove: 19,
  meia: 6,
})
export { toNumber, toCardinal, multiples }