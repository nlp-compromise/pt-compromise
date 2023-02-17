import test from 'tape'
import nlp from '../_lib.js'
let here = '[number-parse] '

let arr = [
  // [1, 'um'],
  [2, 'dois'],
  // [2, 'duas'],
  [3, 'três'],
  [4, 'quatro'],
  [5, 'cinco'],
  [6, 'seis'],
  [7, 'sete'],
  [8, 'oito'],
  [9, 'nove'],
  [10, 'dez'],
  [11, 'onze'],
  [12, 'doze'],
  [13, 'treze'],
  [14, 'catorze'],
  [15, 'quinze'],
  [16, 'dezesseis'],  // [16, 'dezasseis'],
  [17, 'dezessete'],//  [17, 'dezassete'],
  [18, 'dezoito'],
  [19, 'dezenove'],  // [19, 'dezanove'],
  [20, 'vinte'],
  [21, 'vinte e um'],  // [21, 'vinte e uma'],
  [22, 'vinte e dois'],  // [22, 'vinte e duas'],
  [23, 'vinte e três'],
  [24, 'vinte e quatro'],
  [25, 'vinte e cinco'],
  [26, 'vinte e seis'],
  [27, 'vinte e sete'],
  [28, 'vinte e oito'],
  [29, 'vinte e nove'],
  [30, 'trinta'],
  [31, 'trinta e um'],  // [31, 'trinta e uma'],
  [32, 'trinta e dois'],  // [32, 'trinta e duas'],
  [33, 'trinta e três'],
  [34, 'trinta e quatro'],
  [35, 'trinta e cinco'],
  [36, 'trinta e seis'],
  [37, 'trinta e sete'],
  [38, 'trinta e oito'],
  [39, 'trinta e nove'],
  [40, 'quarenta'],
  [41, 'quarenta e um'],//  [41, 'quarenta e uma'],
  [42, 'quarenta e dois'],//  [42, 'quarenta e duas'],
  [43, 'quarenta e três'],
  [44, 'quarenta e quatro'],
  [45, 'quarenta e cinco'],
  [46, 'quarenta e seis'],
  [47, 'quarenta e sete'],
  [48, 'quarenta e oito'],
  [49, 'quarenta e nove'],
  [50, 'cinquenta'],
  [51, 'cinquenta e um'],
  [52, 'cinquenta e dois'],
  [53, 'cinquenta e três'],
  [54, 'cinquenta e quatro'],
  [55, 'cinquenta e cinco'],
  [56, 'cinquenta e seis'],
  [57, 'cinquenta e sete'],
  [58, 'cinquenta e oito'],
  [59, 'cinquenta e nove'],
  [60, 'sessenta'],
  [61, 'sessenta e um'],
  [62, 'sessenta e dois'],
  [63, 'sessenta e três'],
  [64, 'sessenta e quatro'],
  [65, 'sessenta e cinco'],
  [66, 'sessenta e seis'],
  [67, 'sessenta e sete'],
  [68, 'sessenta e oito'],
  [69, 'sessenta e nove'],
  [70, 'setenta'],
  [71, 'setenta e um'],
  [72, 'setenta e dois'],
  [73, 'setenta e três'],
  [74, 'setenta e quatro'],
  [75, 'setenta e cinco'],
  [76, 'setenta e seis'],
  [77, 'setenta e sete'],
  [78, 'setenta e oito'],
  [79, 'setenta e nove'],
  [80, 'oitenta'],
  [81, 'oitenta e um'],
  [82, 'oitenta e dois'],
  [83, 'oitenta e três'],
  [84, 'oitenta e quatro'],
  [85, 'oitenta e cinco'],
  [86, 'oitenta e seis'],
  [87, 'oitenta e sete'],
  [88, 'oitenta e oito'],
  [89, 'oitenta e nove'],
  [90, 'noventa'],
  [91, 'noventa e um'],
  [92, 'noventa e dois'],//  [92, 'noventa e duas'],
  [93, 'noventa e três'],
  [94, 'noventa e quatro'],
  [95, 'noventa e cinco'],
  [96, 'noventa e seis'],
  [97, 'noventa e sete'],
  [98, 'noventa e oito'],
  [99, 'noventa e nove'],
  [100, 'cem'],
  [200, 'duzentos'],//  [200, 'duzentas'],
  [300, 'trezentos'],//  [300, 'trezentas'],
  [400, 'quatrocentos'],//  [400, 'quatrocentas'],
  [500, 'quinhentos'],//  [500, 'quinhentas'],
  [600, 'seiscentos'],//  [600, 'seiscentas'],
  [700, 'setecentos'],//  [700, 'setecentas'],
  [800, 'oitocentos'],//  [800, 'oitocentas'],
  [900, 'novecentos'],//  [900, 'novecentas'],
  [121, 'cento e vinte e um'],
  [487, 'quatrocentos e oitenta e sete'],
  [701, 'setecentos e um'],
  [811, 'oitocentos e onze'],
  [940, 'novecentos e quarenta'],
  [1204, 'mil duzentos e quatro'],
  // [2058, 'dois mil cinquenta e oito'],
  [1200, 'mil e duzentos'],
  [2400, 'dois mil e quatrocentos'],
  [2004, 'dois mil e quatro'],
  [5009, 'cinco mil e nove'],
  // [6, 'meia'],//slang
  [0, 'zero'],
  [1001, 'mil e um'],
  [1020, 'mil e vinte'],
  [1200, 'mil e duzentos'],
  [1215, 'mil duzentos e quinze'],
  [1900, 'mil e novecentos'],
  [1981, 'mil novecentos e oitenta e um'],
  [2000, 'dois mil'],
  [10000, 'dez mil'],
  [25000, 'vinte e cinco mil'],
  [300000, 'trezentos mil'],
  [555500, 'quinhentos e cinquenta e cinco mil e quinhentos'],
  [555555, 'quinhentos e cinquenta e cinco mil quinhentos e cinquenta e cinco'],

  [30, 'trinta'],
  [500, 'quinhentos'],
  [40, 'quarenta'],
  [600, 'seiscentos'],
  [50, 'cinquenta'],
  [700, 'setecentos'],
  [60, 'sessenta'],
  [800, 'oitocentos'],
  [70, 'setenta'],
  [900, 'novecentos'],
  [80, 'oitenta'],
  [1000, 'mil'],
  [90, 'noventa'],
  [2000, 'dois mil'],
  [100, 'cem'],
  [3000, 'três mil'],
  [200, 'duzentos'],
  [1000000, 'um milhão'],
  [300, 'trezentos'],
  [2000000, 'dois milhões'],
  [400, 'quatrocentos'],
  [1000000000, 'um bilhão'],
  [-90, 'menos noventa'],
]
test('number-tag:', function (t) {
  arr.forEach(a => {
    t.equal(nlp(a[1]).has('^#Value+$'), true, here + '[tag] ' + a[1])
  })
  t.end()
})

test('number-parse:', function (t) {
  arr.forEach(a => {
    let [want, str] = a
    let doc = nlp(str)
    let n = doc.numbers().get()[0]
    t.equal(n, want, here + '[toNumber] ' + str)
  })
  t.end()
})

test('number-create:', function (t) {
  arr.forEach(a => {
    let [num, str] = a
    let doc = nlp(String(num))
    doc.numbers().toText()
    t.equal(doc.text(), str, here + '[toText] ' + num)
  })
  t.end()
})

test('misc:', function (t) {
  let doc = nlp('cinquenta e cinco dólares')
  doc.numbers().minus(10)
  t.equal(doc.text(), 'quarenta e cinco dólares', here + 'minus')
  t.end()
})