import data from '../data.js'

let toNumber = {}
let toCardinal = {}
let multiples = {
  'cem': 100,
  'cento': 100,
  'centésimo': 100,
  'mil': 1000,
  'milésimo': 1000,
  'milhão': 1000000,
  'milhões': 1000000,
  'milionésimo': 1000000,
  'bilhão': 1000000000,
  'bilhões': 1000000000,
  'bilionésimo': 1000000000,
}

data.ones.concat(data.tens, data.hundreds, data.multiples).forEach(a => {
  let [n, card, ord] = a
  toNumber[card] = n //cardinal
  if (/os$/.test(card)) {
    let f = card.replace(/os$/, 'as')
    toNumber[f] = n //female
  }
  if (ord) {
    toNumber[ord] = n//ord
  }
})

// extras
Object.assign(toNumber, {
  zero: 0,
  uma: 1,
  duas: 2,
  dezasseis: 16,
  dezassete: 17,
  dezanove: 19,
  cinqüenta: 50,
  qüinquagésimo: 50,
  meia: 6,
})
export { toNumber, toCardinal, multiples }