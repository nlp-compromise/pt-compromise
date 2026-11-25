import test from 'tape'
import nlp from '../../_lib.js'
const here = '[number-forms] '
nlp.verbose(false)

const get = str => nlp(str).numbers().get()
const run = function (str, fn) {
  const doc = nlp(str)
  fn(doc.numbers())
  return doc.text()
}

test('negatives:', function (t) {
  t.deepEqual(get('-5'), [-5], here + '-5')
  t.deepEqual(get('−5'), [-5], here + 'minus sign')
  t.deepEqual(get('menos cinco'), [-5], here + 'menos cinco')
  t.deepEqual(get('menos 5'), [-5], here + 'menos 5')
  t.deepEqual(get('menos 5 graus'), [-5], here + 'menos 5 graus')
  t.deepEqual(get('menos um milhão'), [-1e6], here + 'menos um milhão')
  t.deepEqual(get('faz menos cinco graus'), [-5], here + 'in a sentence')
  t.equal(nlp('menos cinco').numbers().length, 1, here + 'one number')
  // not a sign
  t.deepEqual(get('três menos dois'), [3, 2], here + 'três menos dois')
  t.deepEqual(get('pelo menos cinco'), [5], here + 'pelo menos')
  t.deepEqual(get('mais ou menos cinco'), [5], here + 'mais ou menos')
  const arr = [
    // [str, toText/toNumber, add(10), set(-3), subtract(2)]
    ['-5', 'menos cinco', '5', '-3', '-7'],
    ['menos cinco', '-5', 'cinco', 'menos três', 'menos sete'],
    ['tem -5 aqui', 'tem menos cinco aqui', 'tem 5 aqui', 'tem -3 aqui', 'tem -7 aqui'],
    ['(-5)', '(menos cinco)', '(5)', '(-3)', '(-7)'],
  ]
  arr.forEach(a => {
    const [str, other, add, set, minus] = a
    t.equal(run(str, m => m.toText().toNumber().toText()), /[0-9]/.test(str) ? other : str, here + str + ' toText')
    t.equal(run(str, m => m.toNumber().toText().toNumber()), /[0-9]/.test(str) ? str : other, here + str + ' toNumber')
    t.equal(run(str, m => m.add(10)), add, here + str + ' add')
    t.equal(run(str, m => m.set(-3)), set, here + str + ' set')
    t.equal(run(str, m => m.subtract(2)), minus, here + str + ' subtract')
  })
  t.equal(run('5', m => m.subtract(10)), '-5', here + 'below zero')
  t.equal(run('cinco', m => m.subtract(10)), 'menos cinco', here + 'below zero, in words')
  t.equal(run('menos cinco', m => m.add(5)), 'zero', here + 'back to zero')
  t.equal(run('menos 5 graus', m => m.toText()), 'menos cinco graus', here + 'menos 5 toText')
  let doc = nlp('menos cinco')
  t.deepEqual(doc.numbers().subtract(1).add(2).get(), [-4], here + 'chained')
  doc = nlp('-5')
  t.deepEqual(doc.numbers().toText().get(), [-5], here + 'chained toText')
  t.deepEqual(doc.numbers().get(), [-5], here + 'found again')
  t.end()
})

test('decimals and grouping:', function (t) {
  const arr = [
    ['3,5', 3.5],
    ['3,50', 3.5],
    ['1.000', 1000],
    ['1.234,56', 1234.56],
    ['1.000.000', 1e6],
    ['1 000', 1000],
    ['0,25', 0.25],
    ['custa 3,50 euros', 3.5],
    ['cerca de 2,5 quilos', 2.5],
    ['custa 1.000 euros', 1000],
    ['custa 1.234,56 euros', 1234.56],
    ['25.000 habitantes', 25000],
    ['três vírgula cinco', 3.5],
    ['zero vírgula cinco', 0.5],
    ['três vírgula catorze', 3.14],
    ['três vírgula vinte e cinco', 3.25],
    ['três vírgula zero cinco', 3.05],
    ['dois mil vírgula cinco', 2000.5],
  ]
  arr.forEach(a => {
    t.deepEqual(get(a[0]), [a[1]], here + a[0])
  })
  // math keeps the way it was written
  t.equal(run('1,5', m => m.add(1)), '2,5', here + '1,5 add')
  t.equal(run('1.234', m => m.add(2)), '1.236', here + '1.234 add')
  t.equal(run('1.234,56', m => m.add(1000)), '2.234,56', here + '1.234,56 add')
  t.equal(run('999', m => m.add(1)), '1000', here + 'no new grouping')
  t.equal(run('1.000', m => m.subtract(1)), '999', here + 'under a thousand')
  t.equal(run('0,1', m => m.add(0.2)), '0,3', here + 'no float noise')
  t.equal(run('2,5', m => m.add(0.5)), '3', here + 'to a whole number')
  t.equal(run('1,5', m => m.set(3.25)), '3,25', here + 'set')
  t.equal(run('1,5 litros', m => m.toText()), '1,5 litros', here + 'no words for a decimal')
  t.equal(run('1.000 gatos', m => m.toText()), 'mil gatos', here + '1.000 toText')
  t.equal(run('três vírgula cinco', m => m.toNumber()), '3,5', here + 'vírgula toNumber')
  t.equal(run('três vírgula zero cinco', m => m.toNumber()), '3,05', here + 'vírgula zero toNumber')
  // a comma between two numbers is not 'vírgula'
  t.deepEqual(get('três, cinco'), [3, 5], here + 'a list')
  t.equal(nlp('falta uma vírgula').numbers().found, false, here + 'vírgula is a word')
  t.end()
})

test('text ordinals:', function (t) {
  const arr = [
    ['primeiro', 1],
    ['primeira', 1],
    ['segundo', 2],
    ['segunda', 2],
    ['terceiro', 3],
    ['terceira', 3],
    ['quarto', 4],
    ['quinto', 5],
    ['sexto', 6],
    ['sétimo', 7],
    ['oitavo', 8],
    ['nono', 9],
    ['décimo', 10],
    ['décima', 10],
    ['décimo primeiro', 11],
    ['undécimo', 11],
    ['décimo segundo', 12],
    ['duodécimo', 12],
    ['décimo terceiro', 13],
    ['décimo nono', 19],
    ['vigésimo', 20],
    ['vigésimo primeiro', 21],
    ['vigésima primeira', 21],
    ['trigésimo', 30],
    ['quadragésimo', 40],
    ['quinquagésimo', 50],
    ['sexagésimo', 60],
    ['septuagésimo', 70],
    ['octogésimo', 80],
    ['nonagésimo', 90],
    ['centésimo', 100],
    ['centésimo vigésimo terceiro', 123],
    ['ducentésimo', 200],
    ['quingentésimo', 500],
    ['milésimo', 1000],
    ['milésimo primeiro', 1001],
    ['milionésimo', 1e6],
    // plurals
    ['primeiros', 1],
    ['primeiras', 1],
    ['décimas primeiras', 11],
  ]
  arr.forEach(a => {
    const m = nlp(a[0]).numbers()
    t.deepEqual(m.get(), [a[1]], here + a[0])
    t.equal(m.isOrdinal().length, 1, here + a[0] + ' is ordinal')
  })
  t.deepEqual(get('o primeiro dia'), [1], here + 'primeiro dia')
  t.deepEqual(get('a primeira vez'), [1], here + 'primeira vez')
  t.deepEqual(get('mora no terceiro andar'), [3], here + 'terceiro andar')
  t.deepEqual(get('os primeiros dias'), [1], here + 'primeiros dias')
  // not ordinals
  t.deepEqual(get('segundo o jornal'), [], here + 'segundo o jornal')
  t.deepEqual(get('segundo ele'), [], here + 'segundo ele')
  t.deepEqual(get('em segundo lugar'), [2], here + 'em segundo lugar')
  t.deepEqual(get('cinco segundos'), [5], here + 'cinco segundos')
  t.deepEqual(get('na segunda-feira'), [], here + 'segunda-feira')
  t.deepEqual(get('sexta-feira às 3'), [3], here + 'sexta-feira')
  t.end()
})

test('numeric ordinals:', function (t) {
  const arr = [
    ['1º', 1],
    ['1.º', 1],
    ['1ª', 1],
    ['1.ª', 1],
    ['1o', 1],
    ['1a', 1],
    ['2º', 2],
    ['3a', 3],
    ['21º', 21],
    ['100ª', 100],
  ]
  arr.forEach(a => {
    const m = nlp(a[0]).numbers()
    t.deepEqual(m.get(), [a[1]], here + a[0])
    t.equal(m.isOrdinal().length, 1, here + a[0] + ' is ordinal')
    t.equal(nlp(a[0]).terms().length, 1, here + a[0] + ' is one term')
  })
  t.deepEqual(get('o 3º andar'), [3], here + 'in a sentence')
  t.deepEqual(get('a 2ª vez'), [2], here + 'feminine, in a sentence')
  // a unit is still a unit
  t.equal(nlp('5km').numbers().isOrdinal().found, false, here + '5km')
  t.equal(nlp('5m').numbers().isOrdinal().found, false, here + '5m')
  t.end()
})

test('ordinal conversions:', function (t) {
  const arr = [
    // [str, toCardinal, toNumber]
    ['primeiro', 'um', '1º'],
    ['primeira', 'uma', '1ª'],
    ['o primeiro dia', 'o um dia', 'o 1º dia'],
    ['a primeira vez', 'a uma vez', 'a 1ª vez'],
    ['segundo', 'dois', '2º'],
    ['segunda', 'duas', '2ª'],
    ['décimo', 'dez', '10º'],
    ['décimo primeiro', 'onze', '11º'],
    ['décimo sexto', 'dezesseis', '16º'],
    ['vigésimo primeiro', 'vinte e um', '21º'],
    ['vigésima primeira', 'vinte e uma', '21ª'],
    ['centésimo', 'cem', '100º'],
    ['centésimo primeiro', 'cento e um', '101º'],
    ['ducentésima', 'duzentas', '200ª'],
    ['milésimo', 'mil', '1000º'],
  ]
  arr.forEach(a => {
    const [str, card, num] = a
    t.equal(run(str, m => m.toCardinal()), card, here + str + ' toCardinal')
    t.equal(run(str, m => m.toNumber()), num, here + str + ' toNumber')
    // and back again
    t.equal(run(str, m => m.toNumber().toText()), str, here + str + ' toNumber toText')
    t.equal(run(str, m => m.toCardinal().toOrdinal()), str, here + str + ' toCardinal toOrdinal')
    t.equal(run(str, m => m.toOrdinal()), str, here + str + ' toOrdinal')
  })
  const nums = [
    // [str, toText, toCardinal]
    ['1º', 'primeiro', '1'],
    ['1ª', 'primeira', '1'],
    ['1.º', 'primeiro', '1'],
    ['1.ª', 'primeira', '1'],
    ['1o', 'primeiro', '1'],
    ['1a', 'primeira', '1'],
    ['2º', 'segundo', '2'],
    ['11º', 'décimo primeiro', '11'],
    ['21ª', 'vigésima primeira', '21'],
    ['100º', 'centésimo', '100'],
    ['o 3º andar', 'o terceiro andar', 'o 3 andar'],
  ]
  nums.forEach(a => {
    const [str, text, card] = a
    t.equal(run(str, m => m.toText()), text, here + str + ' toText')
    t.equal(run(str, m => m.toCardinal()), card, here + str + ' toCardinal')
    t.equal(run(str, m => m.toText().toNumber()), str.replace(/\.|o$/, 'º').replace(/a$/, 'ª').replace('ºº', 'º').replace('ºª', 'ª'), here + str + ' toText toNumber')
  })
  t.equal(run('a terceira vez', m => m.toNumber()), 'a 3ª vez', here + 'terceira vez toNumber')
  t.equal(run('a terceira vez', m => m.toNumber().toText()), 'a terceira vez', here + 'terceira vez, and back')
  // from a cardinal
  t.equal(run('cinco', m => m.toOrdinal()), 'quinto', here + 'cinco')
  t.equal(run('vinte e um', m => m.toOrdinal()), 'vigésimo primeiro', here + 'vinte e um')
  t.equal(run('vinte e uma', m => m.toOrdinal()), 'vigésima primeira', here + 'vinte e uma')
  t.equal(run('duas', m => m.toOrdinal()), 'segunda', here + 'duas')
  t.equal(run('cento e vinte e três', m => m.toOrdinal()), 'centésimo vigésimo terceiro', here + '123')
  t.equal(run('5', m => m.toOrdinal()), '5º', here + '5')
  t.equal(run('342', m => m.toOrdinal()), '342º', here + '342')
  t.equal(run('a 1 menina', m => m.toOrdinal()), 'a 1ª menina', here + '1 menina')
  t.equal(run('a 1 menina', m => m.toText().toOrdinal()), 'a primeira menina', here + 'primeira menina')
  t.equal(run('o 1 dia', m => m.toText().toOrdinal()), 'o primeiro dia', here + 'primeiro dia')
  // the plural is kept
  t.equal(run('os primeiros dias', m => m.add(1)), 'os segundos dias', here + 'primeiros + 1')
  t.equal(run('as primeiras vezes', m => m.add(2)), 'as terceiras vezes', here + 'primeiras + 2')
  // math
  t.equal(run('o segundo dia', m => m.subtract(1)), 'o primeiro dia', here + 'segundo - 1')
  t.equal(run('o segundo dia', m => m.add(1)), 'o terceiro dia', here + 'segundo + 1')
  t.equal(run('a segunda vez', m => m.add(1)), 'a terceira vez', here + 'segunda + 1')
  t.equal(run('o décimo dia', m => m.add(1)), 'o décimo primeiro dia', here + 'décimo + 1')
  t.equal(run('1.º', m => m.add(1)), '2.º', here + '1.º + 1')
  t.equal(run('2ª', m => m.add(1)), '3ª', here + '2ª + 1')
  t.equal(run('2º', m => m.add(1)), '3º', here + '2º + 1')
  t.equal(run('1o', m => m.add(1)), '2o', here + '1o + 1')
  // no ordinal for these
  t.equal(run('zero', m => m.toOrdinal()), 'zero', here + 'zero')
  t.equal(run('menos cinco', m => m.toOrdinal()), 'menos cinco', here + 'menos cinco')
  t.equal(run('3,5', m => m.toOrdinal()), '3,5', here + '3,5')
  t.equal(run('primeiro', m => m.subtract(1)), 'primeiro', here + 'primeiro - 1')
  t.end()
})

test('fractions:', function (t) {
  const arr = [
    ['1/2', 0.5],
    ['3/4', 0.75],
    ['meio', 0.5],
    ['um meio', 0.5],
    ['um terço', 1 / 3],
    ['dois terços', 2 / 3],
    ['três quartos', 0.75],
    ['dois quintos', 0.4],
    ['um terço dos votos', 1 / 3],
    ['três quartos de litro', 0.75],
    ['meio milhão', 500000],
    ['meio km', 0.5],
    ['dois e meio', 2.5],
    ['duas e meia', 2.5],
    ['um milhão e meio', 1500000],
  ]
  arr.forEach(a => {
    const m = nlp(a[0]).numbers()
    t.equal(m.length, 1, here + 'one number: ' + a[0])
    t.equal(m.get()[0], a[1], here + a[0])
  })
  // not fractions
  t.deepEqual(get('um meio de transporte'), [], here + 'um meio de')
  t.deepEqual(get('o meio ambiente'), [], here + 'meio ambiente')
  t.deepEqual(get('no meio da rua'), [], here + 'no meio de')
  t.deepEqual(get('uma meia'), [], here + 'uma meia')
  // a digit after 'e' is its own number
  t.deepEqual(get('quarenta e 3'), [40, 3], here + 'quarenta e 3')
  t.deepEqual(get('3 e quarenta'), [3, 40], here + '3 e quarenta')
  // nothing sensible to write
  t.equal(run('três quartos', m => m.toNumber()), 'três quartos', here + 'toNumber')
  t.equal(run('três quartos', m => m.toOrdinal()), 'três quartos', here + 'toOrdinal')
  t.equal(run('três quartos', m => m.add(1)), 'três quartos', here + 'add')
  t.equal(run('1/2', m => m.toText()), '1/2', here + 'toText')
  t.equal(run('três quartos', m => m.set(5)), 'cinco', here + 'set')
  t.end()
})

// 'um' and 'uma' are articles - and a number only inside of one, before a unit, or with no word after them
test('um, uma:', function (t) {
  const arr = [
    ['um', []],
    ['uma', []],
    ['um gato', []],
    ['uma casa', []],
    ['tenho um gato', []],
    ['um dia de um mês', []],
    ['só tenho um.', [1]],
    ['um, dois e três', [1, 2, 3]],
    ['um milhão', [1e6]],
    ['um bilhão', [1e9]],
    ['um trilhão', [1e12]],
    ['trinta e um dias', [31]],
    ['quarenta e uma pessoas', [41]],
    ['cento e um gatos', [101]],
    ['mil e uma noites', [1001]],
    ['vinte e uma casas', [21]],
    ['um euro', [1]],
    ['um real', [1]],
    ['uma libra', [1]],
    ['um por cento', [1]],
    ['um km', [1]],
  ]
  arr.forEach(a => {
    t.deepEqual(get(a[0]), a[1], here + a[0])
  })
  // an article is still an article
  t.equal(nlp('um gato').has('#Determiner'), true, here + 'um gato is an article')
  t.equal(nlp('uma casa').has('#Determiner'), true, here + 'uma casa is an article')
  t.equal(nlp('vinte e uma casas').has('#Determiner'), false, here + 'vinte e uma is not')
  // written before a noun
  t.equal(run('tenho 1 gato', m => m.toText()), 'tenho um gato', here + '1 gato')
  t.equal(run('tenho 1', m => m.toText()), 'tenho um', here + '1')
  t.equal(run('tenho 21 gatos', m => m.toText()), 'tenho vinte e um gatos', here + '21 gatos')
  t.equal(run('página 21', m => m.toText()), 'página vinte e um', here + 'página 21')
  // and still found, in the same document
  const doc = nlp('tenho 1 gato')
  t.deepEqual(doc.numbers().toText().get(), [1], here + 'chained')
  t.deepEqual(doc.numbers().get(), [1], here + 'found again')
  t.equal(doc.numbers().toNumber().all().text(), 'tenho 1 gato', here + 'and back')
  t.end()
})

test('agreement forms:', function (t) {
  const arr = [
    ['duas', 2],
    ['duzentas', 200],
    ['trezentas', 300],
    ['quatrocentas', 400],
    ['quinhentas', 500],
    ['seiscentas', 600],
    ['setecentas', 700],
    ['oitocentas', 800],
    ['novecentas', 900],
    ['duzentas mil', 200000],
    ['duas mil', 2000],
    ['duas mil e duzentas', 2200],
    ['cem', 100],
    ['cem mil', 100000],
    ['cento e um', 101],
    ['cento e uma', 101],
    ['cento e vinte', 120],
    ['cem milhões', 100e6],
    // european spellings
    ['dezasseis', 16],
    ['dezesseis', 16],
    ['dezassete', 17],
    ['dezessete', 17],
    ['dezanove', 19],
    ['dezenove', 19],
    ['catorze', 14],
    ['quatorze', 14],
    ['dezasseis mil', 16000],
    ['mil milhões', 1e9],
    // without their accents
    ['tres', 3],
    ['um milhao', 1e6],
    ['dois milhoes', 2e6],
  ]
  arr.forEach(a => {
    t.deepEqual(get(a[0]), [a[1]], here + a[0])
  })
  // the gender that was written is kept
  t.equal(run('vinte e uma casas', m => m.add(10)), 'trinta e uma casas', here + 'vinte e uma + 10')
  t.equal(run('vinte e uma casas', m => m.add(1)), 'vinte e duas casas', here + 'vinte e uma + 1')
  t.equal(run('duzentas casas', m => m.add(100)), 'trezentas casas', here + 'duzentas + 100')
  t.equal(run('duzentas casas', m => m.add(1)), 'duzentas e uma casas', here + 'duzentas + 1')
  t.equal(run('duas casas', m => m.add(2000)), 'duas mil e duas casas', here + 'duas + 2000')
  t.equal(run('duas casas', m => m.add(2e6)), 'dois milhões e duas casas', here + 'a million is masculine')
  t.equal(run('vinte gatos', m => m.add(1)), 'vinte e um gatos', here + 'vinte + 1')
  // the gender of a noun, where the tagger knows it
  t.equal(run('tenho 1 menina', m => m.toText()), 'tenho uma menina', here + '1 menina')
  t.equal(run('tenho 2 meninas', m => m.toText()), 'tenho duas meninas', here + '2 meninas')
  t.equal(run('200 professoras', m => m.toText()), 'duzentas professoras', here + '200 professoras')
  t.equal(run('tenho cinco meninas', m => m.set(2)), 'tenho duas meninas', here + 'set 2 meninas')
  t.equal(run('tenho 2 meninos', m => m.toText()), 'tenho dois meninos', here + '2 meninos')
  // .. or its article says so
  t.equal(run('as 2 casas', m => m.toText()), 'as duas casas', here + 'as 2 casas')
  t.equal(run('os 2 gatos', m => m.toText()), 'os dois gatos', here + 'os 2 gatos')
  // the brazilian spelling is the one that is written
  t.equal(run('dezasseis', m => m.add(1)), 'dezessete', here + 'dezasseis + 1')
  // cem or cento
  t.equal(run('noventa e nove', m => m.add(1)), 'cem', here + '99 + 1')
  t.equal(run('cem', m => m.add(1)), 'cento e um', here + 'cem + 1')
  t.equal(run('cento e um', m => m.subtract(1)), 'cem', here + 'cento e um - 1')
  t.equal(run('cem', m => m.toNumber()), '100', here + 'cem toNumber')
  t.equal(run('cem gatos', m => m.set(100000)), 'cem mil gatos', here + 'cem mil')
  t.end()
})

test('number arguments:', function (t) {
  t.equal(run('cinco', m => m.set('um milhão')), 'um milhão', here + 'set um milhão')
  t.equal(run('5', m => m.add('mil')), '1005', here + 'add mil')
  t.equal(run('5', m => m.set('3,5')), '3,5', here + 'set 3,5')
  t.equal(run('cinco', m => m.add('trinta e um')), 'trinta e seis', here + 'add trinta e um')
  t.equal(run('cinco', m => m.set('menos dois')), 'menos dois', here + 'set menos dois')
  t.equal(run('cinco', m => m.add('dois três')), 'cinco', here + 'two numbers is not one')
  t.equal(run('tenho 4 euros', m => m.set('doze')), 'tenho 12 euros', here + 'set text-string')
  t.equal(run('tenho quatro euros', m => m.set('12')), 'tenho doze euros', here + 'set digit-string')
  t.equal(run('tenho 4 euros', m => m.set('gato')), 'tenho 4 euros', here + 'not a number')
  t.equal(run('tenho 4 euros', m => m.plus('2')), 'tenho 6 euros', here + 'plus digit-string')
  t.equal(run('tenho 4 euros', m => m.subtract('dois')), 'tenho 2 euros', here + 'subtract text-string')
  t.equal(run('tenho quatro euros', m => m.minus(1)), 'tenho três euros', here + 'minus')
  t.equal(run('tenho 4 euros', m => m.increment().increment().decrement()), 'tenho 5 euros', here + 'increment')
  t.equal(nlp('tenho 4 euros').numbers().set('gato').viewType, 'Numbers', here + 'still numbers')
  t.end()
})

test('number methods:', function (t) {
  const doc = nlp('três cães, cinco gatos e nove patos')
  t.deepEqual(doc.numbers().get(), [3, 5, 9], here + 'get')
  t.equal(doc.numbers().greaterThan(4).length, 2, here + 'greaterThan')
  t.equal(doc.numbers().lessThan(4).text(), 'três', here + 'lessThan')
  t.equal(doc.numbers().between(1, 6).length, 2, here + 'between')
  t.equal(doc.numbers().isEqual(5).text(), 'cinco', here + 'isEqual')
  t.equal(doc.numbers(1).text(), 'cinco', here + 'nth')
  t.equal(doc.values().length, 3, here + 'values alias')
  // json
  let json = doc.numbers().json(1)
  t.equal(json.length, 1, here + 'json(1) length')
  t.equal(json[0].number.num, 5, here + 'json(1) num')
  t.deepEqual(doc.numbers().json(9), [], here + 'json out-of-range')
  json = doc.numbers().json({ terms: false })
  t.equal(json.length, 3, here + 'json options length')
  t.equal(json[0].terms, undefined, here + 'json options respected')
  t.equal(json[2].number.num, 9, here + 'json options num')
  // parse
  const obj = nlp('vinte e dois').numbers().parse()[0]
  t.equal(obj.num, 22, here + 'parse num')
  t.equal(obj.isText, true, here + 'parse isText')
  t.equal(obj.isOrdinal, false, here + 'parse isOrdinal')
  // nothing found
  const none = nlp('o gato come').numbers()
  t.deepEqual(none.get(), [], here + 'get with no numbers')
  t.deepEqual(none.parse(), [], here + 'parse with no numbers')
  t.deepEqual(none.json(), [], here + 'json with no numbers')
  t.equal(none.toText().found, false, here + 'toText with no numbers')
  // ordinal or cardinal
  t.equal(nlp('a terceira tentativa').numbers().isOrdinal().text(), 'terceira', here + 'isOrdinal')
  t.equal(nlp('a terceira tentativa').numbers().isCardinal().found, false, here + 'ordinal is not cardinal')
  t.equal(nlp('três tentativas').numbers().isCardinal().text(), 'três', here + 'isCardinal')
  // units
  t.equal(nlp('corre 5 km por dia').numbers().units().text(), 'km', here + 'units')
  t.end()
})
