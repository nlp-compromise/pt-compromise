import test from 'tape'
import nlp from '../../_lib.js'
const here = '[pt-noun-feminine] '
nlp.verbose(false)

// [masculine, feminine]
const arr = [
  // -o → -a
  ['menino', 'menina'],
  ['gato', 'gata'],
  ['aluno', 'aluna'],
  ['amigo', 'amiga'],
  ['médico', 'médica'],
  ['filho', 'filha'],
  ['tio', 'tia'],
  ['primo', 'prima'],
  ['vizinho', 'vizinha'],
  ['advogado', 'advogada'],
  ['engenheiro', 'engenheira'],
  ['sogro', 'sogra'],
  ['neto', 'neta'],
  ['namorado', 'namorada'],
  ['cozinheiro', 'cozinheira'],
  ['enfermeiro', 'enfermeira'],
  // -or → -ora
  ['professor', 'professora'],
  ['cantor', 'cantora'],
  ['autor', 'autora'],
  ['escritor', 'escritora'],
  ['diretor', 'diretora'],
  ['pintor', 'pintora'],
  ['vendedor', 'vendedora'],
  ['trabalhador', 'trabalhadora'],
  ['doutor', 'doutora'],
  // -or → -triz
  ['ator', 'atriz'],
  ['imperador', 'imperatriz'],
  ['embaixador', 'embaixatriz'],
  // -ão → -ã, -oa
  ['irmão', 'irmã'],
  ['campeão', 'campeã'],
  ['cidadão', 'cidadã'],
  ['anão', 'anã'],
  ['leão', 'leoa'],
  ['patrão', 'patroa'],
  // -ês → -esa
  ['freguês', 'freguesa'],
  ['camponês', 'camponesa'],
  // -esa, -essa, -isa, -ina
  ['príncipe', 'princesa'],
  ['barão', 'baronesa'],
  ['conde', 'condessa'],
  ['poeta', 'poetisa'],
  ['herói', 'heroína'],
  // irregular
  ['rei', 'rainha'],
  ['judeu', 'judia'],
  ['réu', 'ré'],
]

test('nouns toFeminine:', function (t) {
  arr.forEach(a => {
    const [masc, fem] = a
    const doc = nlp('o ' + masc)
    doc.nouns().toFeminine()
    t.equal(doc.text(), 'a ' + fem, here + `o ${masc} → a ${fem}`)
  })
  t.end()
})

test('nouns conjugate feminine:', function (t) {
  arr.forEach(a => {
    const [masc, fem] = a
    const obj = nlp('o ' + masc).nouns().conjugate()[0] || {}
    t.equal(obj.feminine, fem, here + `${masc} → ${fem}`)
    t.equal(obj.singular, masc, here + `${masc} singular`)
  })
  t.end()
})

test('toFeminine in context:', function (t) {
  const list = [
    ['um menino', 'uma menina'],
    ['o menino e o aluno', 'a menina e a aluna'],
    ['o professor chegou', 'a professora chegou'],
    // already feminine
    ['a menina', 'a menina'],
    ['a mesa', 'a mesa'],
    ['a professora chegou', 'a professora chegou'],
  ]
  list.forEach(a => {
    const [str, want] = a
    const doc = nlp(str)
    doc.nouns().toFeminine()
    t.equal(doc.text(), want, here + `${str} → ${want}`)
  })
  t.end()
})
