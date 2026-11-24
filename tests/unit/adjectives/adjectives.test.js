import test from 'tape'
import nlp from '../../_lib.js'
const here = '[pt-adjectives] '
nlp.verbose(false)

// [male, female, plural, femalePlural]
const arr = [
  ['bonito', 'bonita', 'bonitos', 'bonitas'],
  ['vermelho', 'vermelha', 'vermelhos', 'vermelhas'],
  ['alto', 'alta', 'altos', 'altas'],
  ['magro', 'magra', 'magros', 'magras'],
  ['rico', 'rica', 'ricos', 'ricas'],
  ['branco', 'branca', 'brancos', 'brancas'],
  ['novo', 'nova', 'novos', 'novas'],
  ['velho', 'velha', 'velhos', 'velhas'],
  ['pequeno', 'pequena', 'pequenos', 'pequenas'],
  ['lindo', 'linda', 'lindos', 'lindas'],
  ['brasileiro', 'brasileira', 'brasileiros', 'brasileiras'],
  // -e adjectives have one form for both genders
  ['grande', 'grande', 'grandes', 'grandes'],
  ['forte', 'forte', 'fortes', 'fortes'],
  ['triste', 'triste', 'tristes', 'tristes'],
  ['pobre', 'pobre', 'pobres', 'pobres'],
  ['inteligente', 'inteligente', 'inteligentes', 'inteligentes'],
  // -z → -zes
  ['feliz', 'feliz', 'felizes', 'felizes'],
  // -m → -ns
  ['jovem', 'jovem', 'jovens', 'jovens'],
  // -l → -is
  ['azul', 'azul', 'azuis', 'azuis'],
  ['fácil', 'fácil', 'fáceis', 'fáceis'],
  ['difícil', 'difícil', 'difíceis', 'difíceis'],
  ['útil', 'útil', 'úteis', 'úteis'],
  ['amável', 'amável', 'amáveis', 'amáveis'],
  // nationalities do take a feminine
  ['português', 'portuguesa', 'portugueses', 'portuguesas'],
  ['inglês', 'inglesa', 'ingleses', 'inglesas'],
  ['espanhol', 'espanhola', 'espanhóis', 'espanholas'],
  ['alemão', 'alemã', 'alemães', 'alemãs'],
  // irregular
  ['bom', 'boa', 'bons', 'boas'],
  ['mau', 'má', 'maus', 'más'],
]

test('adjectives conjugate:', function (t) {
  arr.forEach(a => {
    const [male, female, plural, femalePlural] = a
    const res = nlp('ele é ' + male).adjectives().conjugate()
    t.deepEqual(res, [{ male, female, plural, femalePlural }], here + male)
  })
  t.end()
})

test('adjectives conjugate from an inflected form:', function (t) {
  const list = [
    // [text, male]
    ['ela é alta', 'alto'],
    ['ela é boa', 'bom'],
    ['ela é má', 'mau'],
    ['ela é portuguesa', 'português'],
    ['ela é alemã', 'alemão'],
    ['ela é espanhola', 'espanhol'],
    ['eles são bonitos', 'bonito'],
    ['eles são altos', 'alto'],
    ['eles são bons', 'bom'],
    ['eles são portugueses', 'português'],
    ['eles são alemães', 'alemão'],
    ['eles são felizes', 'feliz'],
    ['eles são fáceis', 'fácil'],
    ['eles são azuis', 'azul'],
    ['eles são espanhóis', 'espanhol'],
    ['eles são jovens', 'jovem'],
    ['elas são bonitas', 'bonito'],
    ['elas são altas', 'alto'],
    ['elas são boas', 'bom'],
    ['elas são portuguesas', 'português'],
    ['elas são alemãs', 'alemão'],
  ]
  list.forEach(a => {
    const [str, male] = a
    const want = arr.find(b => b[0] === male)
    const res = nlp(str).adjectives().conjugate()[0] || {}
    t.deepEqual(Object.values(res), want, here + str)
  })
  t.end()
})

test('adjectives selection:', function (t) {
  const doc = nlp('um menino alto e magro')
  t.deepEqual(doc.adjectives().out('array'), ['alto', 'magro'], here + 'finds both')
  t.equal(doc.adjectives().length, 2, here + 'length')
  t.equal(doc.adjectives(1).text(), 'magro', here + 'adjectives(n)')
  t.equal(doc.adjectives().conjugate().length, 2, here + 'conjugates both')
  t.equal(doc.adjectives().conjugate(0).length, 1, here + 'conjugate(n)')
  t.equal(doc.adjectives().conjugate(0)[0].female, 'alta', here + 'conjugate(0) is the first')
  t.equal(doc.adjectives().conjugate(1)[0].female, 'magra', here + 'conjugate(1) is the second')
  // nothing found
  const none = nlp('o gato dorme').adjectives()
  t.equal(none.found, false, here + 'no adjectives')
  t.deepEqual(none.conjugate(), [], here + 'empty conjugate')
  // does not change the document
  const str = 'eles são bonitos'
  const d = nlp(str)
  d.adjectives().conjugate()
  t.equal(d.text(), str, here + 'conjugate does not mutate')
  t.end()
})
