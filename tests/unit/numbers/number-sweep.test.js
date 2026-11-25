import test from 'tape'
import nlp from '../../_lib.js'
const here = '[number-sweep] '
nlp.verbose(false)

// an independent spelling of each number, to compare with
const ones = 'zero um dois três quatro cinco seis sete oito nove dez onze doze treze catorze quinze dezesseis dezessete dezoito dezenove'.split(' ')
const tens = ',,vinte,trinta,quarenta,cinquenta,sessenta,setenta,oitenta,noventa'.split(',')
const hundreds = ',cento,duzentos,trezentos,quatrocentos,quinhentos,seiscentos,setecentos,oitocentos,novecentos'.split(',')
const sizes = [
  [1e12, 'trilhão', 'trilhões'],
  [1e9, 'bilhão', 'bilhões'],
  [1e6, 'milhão', 'milhões'],
  [1e3, 'mil', 'mil'],
  [1, '', ''],
]
// 1-999 - every part is joined by 'e'
const small = function (n) {
  if (n === 100) {
    return 'cem'
  }
  const rest = n % 100
  const parts = [hundreds[Math.floor(n / 100)]]
  if (rest > 0 && rest < 20) {
    parts.push(ones[rest])
  } else {
    parts.push(tens[Math.floor(rest / 10)], rest % 10 ? ones[rest % 10] : '')
  }
  return parts.filter(s => s).join(' e ')
}
// the last group takes an 'e' when it is under a hundred, or is whole hundreds
const spell = function (n) {
  if (n === 0) {
    return 'zero'
  }
  const groups = []
  let rest = n
  sizes.forEach(a => {
    const count = Math.floor(rest / a[0])
    rest -= count * a[0]
    if (count === 1 && a[0] === 1000) {
      groups.push([count, 'mil'])
    } else if (count) {
      groups.push([count, (small(count) + ' ' + (count === 1 ? a[1] : a[2])).trim()])
    }
  })
  let str = ''
  groups.forEach((a, i) => {
    const isLast = i > 0 && i === groups.length - 1
    const hasE = isLast && (a[0] < 100 || a[0] % 100 === 0)
    str += (i === 0 ? '' : ' ') + (hasE ? 'e ' : '') + a[1]
  })
  return str
}

const nums = []
for (let i = 0; i <= 3000; i += 1) {
  nums.push(i)
}
nums.push(3001, 4567, 9999, 10000, 10001, 15015, 21000, 21021, 31000, 99999, 100000, 100001, 101000, 121121)
nums.push(200000, 500500, 999999, 1e6, 1000001, 1001000, 1200000, 2e6, 2000001, 21e6, 100e6, 101e6, 999999999)
nums.push(1e9, 1000000001, 2e9, 21e9, 123456789012, 999999999999, 1e12, 2e12, 1000001000001, 1e12 + 1e9)

test('the reference is right:', function (t) {
  const arr = [
    [0, 'zero'],
    [16, 'dezesseis'],
    [21, 'vinte e um'],
    [30, 'trinta'],
    [99, 'noventa e nove'],
    [100, 'cem'],
    [101, 'cento e um'],
    [110, 'cento e dez'],
    [121, 'cento e vinte e um'],
    [200, 'duzentos'],
    [500, 'quinhentos'],
    [999, 'novecentos e noventa e nove'],
    [1000, 'mil'],
    [1001, 'mil e um'],
    [1100, 'mil e cem'],
    [1120, 'mil cento e vinte'],
    [1200, 'mil e duzentos'],
    [1215, 'mil duzentos e quinze'],
    [2000, 'dois mil'],
    [2500, 'dois mil e quinhentos'],
    [2345, 'dois mil trezentos e quarenta e cinco'],
    [21000, 'vinte e um mil'],
    [100000, 'cem mil'],
    [101000, 'cento e um mil'],
    [555500, 'quinhentos e cinquenta e cinco mil e quinhentos'],
    [555555, 'quinhentos e cinquenta e cinco mil quinhentos e cinquenta e cinco'],
    [1e6, 'um milhão'],
    [1200000, 'um milhão e duzentos mil'],
    [2e6, 'dois milhões'],
    [21e6, 'vinte e um milhões'],
    [1e9, 'um bilhão'],
    [2e9, 'dois bilhões'],
    [1e12, 'um trilhão'],
    [2e12, 'dois trilhões'],
  ]
  arr.forEach(a => {
    t.equal(spell(a[0]), a[1], here + 'spell ' + a[0])
    t.equal(nlp(String(a[0])).numbers().toText().text(), a[1], here + 'toText ' + a[0])
    t.deepEqual(nlp(a[1]).numbers().get(), [a[0]], here + 'get ' + a[1])
  })
  t.end()
})

// each of these is a list of the numbers that fail
test('number sweep:', function (t) {
  const bad = { toText: [], chained: [], parse: [], one: [], toNumber: [], tagged: [] }
  nums.forEach(n => {
    const want = spell(n)
    const doc = nlp(String(n))
    const m = doc.numbers().toText()
    if (doc.text() !== want) {
      bad.toText.push(n)
    }
    // the same view still has the number
    if (m.get()[0] !== n) {
      bad.chained.push(n)
    }
    // and so does a new one
    if (doc.numbers().get()[0] !== n) {
      bad.tagged.push(n)
    }
    // ('um' by itself is an article)
    const found = nlp(n === 1 ? 'tenho um.' : want).numbers()
    if (found.length !== 1 || found.text() !== want) {
      bad.one.push(n)
    }
    if (found.get()[0] !== n) {
      bad.parse.push(n)
    }
    if (m.toNumber().text() !== String(n) || doc.text() !== String(n)) {
      bad.toNumber.push(n)
    }
  })
  Object.keys(bad).forEach(k => {
    t.deepEqual(bad[k], [], here + k + ' - ' + nums.length + ' numbers')
  })
  t.end()
})

test('ordinal sweep:', function (t) {
  const bad = { parse: [], toCardinal: [], toNumber: [] }
  // ('um' by itself is an article - 'primeiro' is in number-forms)
  for (let n = 2; n < 2000; n += 1) {
    const doc = nlp(spell(n))
    doc.numbers().toOrdinal()
    const str = doc.text()
    const m = nlp(str).numbers()
    if (m.length !== 1 || m.get()[0] !== n || m.isOrdinal().length !== 1) {
      bad.parse.push(n)
    }
    if (m.toNumber().text() !== n + 'º') {
      bad.toNumber.push(n)
    }
    if (doc.numbers().toCardinal().text() !== spell(n)) {
      bad.toCardinal.push(n)
    }
  }
  Object.keys(bad).forEach(k => {
    t.deepEqual(bad[k], [], here + 'ordinal ' + k)
  })
  t.end()
})

test('a multi-word number is one number:', function (t) {
  const arr = [
    ['dois mil trezentos e quarenta e cinco gatos', 'dois mil trezentos e quarenta e cinco', 2345],
    ['um milhão e duzentos mil', 'um milhão e duzentos mil', 1200000],
    ['há um milhão de pessoas', 'um milhão', 1e6],
    ['três milhões de euros', 'três milhões', 3e6],
    ['mil milhões de anos', 'mil milhões', 1e9],
    ['dois mil milhões', 'dois mil milhões', 2e9],
    ['um bilhão de reais', 'um bilhão', 1e9],
    ['um trilhão de dólares', 'um trilhão', 1e12],
    ['quinhentas mil pessoas', 'quinhentas mil', 500000],
    ['trinta e um dias', 'trinta e um', 31],
    ['cento e uma casas', 'cento e uma', 101],
    ['mil e uma noites', 'mil e uma', 1001],
    ['5 milhões', '5 milhões', 5e6],
    ['2,5 milhões de euros', '2,5 milhões', 2500000],
    ['3 mil milhões', '3 mil milhões', 3e9],
  ]
  arr.forEach(a => {
    const m = nlp(a[0]).numbers()
    t.equal(m.length, 1, here + 'one number: ' + a[0])
    t.equal(m.text(), a[1], here + 'text: ' + a[0])
    t.deepEqual(m.get(), [a[2]], here + 'value: ' + a[0])
  })
  t.end()
})

test('a list of numbers is a list:', function (t) {
  const arr = [
    ['dois três quatro', [2, 3, 4]],
    ['três e quatro', [3, 4]],
    ['vinte e trinta', [20, 30]],
    ['três, quatro', [3, 4]],
    ['dois mil, três mil', [2000, 3000]],
    ['mil mil', [1000, 1000]],
    ['cem duzentos', [100, 200]],
    ['vinte três', [20, 3]],
    ['quarenta e 3', [40, 3]],
    ['3 e quarenta', [3, 40]],
    ['três menos dois', [3, 2]],
    ['dois milhões de pessoas e três cães', [2e6, 3]],
    ['em 1999 e 2020', [1999, 2020]],
    ['primeiro segundo', [1, 2]],
    ['cinco primeiro', [5, 1]],
  ]
  arr.forEach(a => {
    t.deepEqual(nlp(a[0]).numbers().get(), a[1], here + a[0])
  })
  t.end()
})
