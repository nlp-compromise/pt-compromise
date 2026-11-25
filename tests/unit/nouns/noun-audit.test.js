import test from 'tape'
import nlp from '../../_lib.js'
import list, { pluralOnly, toFeminine } from './_audit.js'
const here = '[noun-audit] '
nlp.verbose(false)

// the string-level transform - with a lexicon to look in, and without it
test('noun audit, transform:', function (t) {
  const { toPlural, fromPlural, toSingular } = nlp.methods().two.transform.noun
  const lexicon = nlp.model().one.lexicon
  list.forEach((o) => {
    const { singular, plural } = o
    const want = [plural.noun, singular.noun]
    t.deepEqual([toPlural(singular.noun), fromPlural(plural.noun)], want, here + singular.noun)
    t.equal(fromPlural(plural.noun, lexicon), singular.noun, here + plural.noun + ' (lexicon)')
  })
  t.equal(toSingular, fromPlural, here + 'toSingular is fromPlural')
  t.end()
})

// the same nouns, after their article
test('noun audit, in context:', function (t) {
  const pick = (res) => res.map((o) => ({ singular: o.singular, plural: o.plural }))
  list.forEach((o) => {
    const { singular, plural } = o
    const want = [{ singular: singular.noun, plural: plural.noun }]
    if (!singular.hmm) {
      const doc = nlp(singular.str)
      t.deepEqual(pick(doc.nouns().conjugate()), want, here + 'conjugate ' + singular.str)
      t.equal(doc.nouns().isPlural().found, false, here + 'not plural ' + singular.str)
      doc.nouns().toPlural()
      t.equal(doc.text(), plural.str, here + 'toPlural ' + singular.str)
    }
    if (!plural.hmm) {
      const doc = nlp(plural.str)
      t.deepEqual(pick(doc.nouns().conjugate()), want, here + 'conjugate ' + plural.str)
      t.equal(doc.nouns().isPlural().text(), plural.noun, here + 'isPlural ' + plural.str)
      doc.nouns().toSingular()
      t.equal(doc.text(), singular.str, here + 'toSingular ' + plural.str)
    }
  })
  t.end()
})

test('noun audit, plural-only:', function (t) {
  pluralOnly.forEach((str) => {
    const doc = nlp(str)
    t.equal(doc.nouns().isPlural().found, true, here + 'isPlural ' + str)
    doc.nouns().toPlural()
    t.equal(doc.text(), str, here + 'toPlural ' + str)
    // .. but 'a costa' is a coast
    if (str !== 'as costas') {
      doc.nouns().toSingular()
      t.equal(doc.text(), str, here + 'toSingular ' + str)
    }
  })
  t.end()
})

// the feminine of a person, or an animal - and its article
test('noun audit, feminine:', function (t) {
  const { toFeminine: toFem, fromFeminine } = nlp.methods().two.transform.noun
  toFeminine.filter((o) => !o.hmm).forEach((o) => {
    const doc = nlp(o.male)
    doc.nouns().toFeminine()
    t.equal(doc.text(), o.female, here + o.male)
    // the bare word
    const [art, male] = o.male.split(' ')
    const female = o.female.split(' ')[1]
    if (art === 'o') {
      t.equal(toFem(male), female, here + 'toFeminine ' + male)
      t.equal(nlp(o.male).nouns().conjugate().pop().feminine, female, here + 'conjugate ' + o.male)
      t.equal(fromFeminine(female), male, here + 'fromFeminine ' + female)
    }
  })
  t.end()
})

test('noun audit, misc:', function (t) {
  const { toPlural, fromPlural, toFeminine: toFem, isCommon, all } = nlp.methods().two.transform.noun
  const lexicon = nlp.model().one.lexicon
  // '-ão' has three plurals
  t.equal(toPlural('xyzação'), 'xyzações', here + '-ção')
  t.equal(fromPlural('xyzações'), 'xyzação', here + '-ções')
  t.equal(toPlural('xyzórfão'), 'xyzórfãos', here + 'unstressed -ão')
  t.equal(fromPlural('mães'), 'mãe', here + 'mães')
  // '-l'
  t.equal(toPlural('xyzal'), 'xyzais', here + '-al')
  t.equal(toPlural('xyzel'), 'xyzéis', here + 'stressed -el')
  t.equal(toPlural('xázel'), 'xázeis', here + 'unstressed -el')
  t.equal(toPlural('xyzil'), 'xyzis', here + 'stressed -il')
  t.equal(toPlural('xázil'), 'xázeis', here + 'unstressed -il')
  t.equal(fromPlural('xyzais'), 'xyzal', here + '-ais')
  t.equal(fromPlural('xyzéis'), 'xyzel', here + '-éis')
  t.equal(fromPlural('xyzáveis'), 'xyzável', here + '-áveis')
  t.equal(fromPlural('reis'), 'rei', here + 'reis')
  t.equal(fromPlural('pais'), 'pai', here + 'pais')
  t.equal(fromPlural('heróis'), 'herói', here + 'heróis')
  t.equal(toPlural('troll'), 'trolls', here + 'troll')
  // '-s', or '-es'
  t.equal(fromPlural('xyzagens'), 'xyzagem', here + '-agens')
  t.equal(fromPlural('teses'), 'tese', here + 'teses')
  t.equal(fromPlural('análises'), 'análise', here + 'análises')
  t.equal(fromPlural('padres'), 'padre', here + 'a consonant cluster')
  t.equal(fromPlural('torres'), 'torre', here + 'torres')
  t.equal(fromPlural('árvores'), 'árvore', here + 'árvores')
  t.equal(fromPlural('bebês'), 'bebê', here + 'bebês')
  t.equal(fromPlural('táxis'), 'táxi', here + 'táxis')
  t.equal(fromPlural('rubis'), 'rubi', here + 'rubis')
  // both plurals are right
  t.equal(fromPlural('hífenes'), 'hífen', here + 'hífenes')
  t.equal(fromPlural('carateres'), 'caráter', here + 'carateres')
  // nothing to do
  t.equal(toPlural('casas'), 'casas', here + 'toPlural of a plural')
  t.equal(fromPlural('casa'), 'casa', here + 'fromPlural of a singular')
  t.equal(fromPlural('inglês'), 'inglês', here + 'inglês is singular')
  t.equal(fromPlural('vírus'), 'vírus', here + 'vírus')
  t.deepEqual(all('lápis'), ['lápis'], here + 'all, invariable')
  t.deepEqual(all('luz'), ['luz', 'luzes'], here + 'all')
  // a lexicon chooses between two singulars
  t.equal(fromPlural('xyzis'), 'xyzil', here + 'default')
  t.equal(fromPlural('xyzis', { xyzi: 'Noun' }), 'xyzi', here + 'lexicon hint, -i')
  t.equal(fromPlural('xyzares', { xyzare: 'Noun' }), 'xyzare', here + 'lexicon hint, -e')
  t.equal(fromPlural('verdes', lexicon), 'verde', here + 'verdes')

  // things have no feminine
  'livro,carro,banco,mercado,coração,avião,amor,motor,computador,mês,banheiro,dinheiro,caderno,sol,papel,dia,mapa'.split(',').forEach((str) => {
    t.equal(toFem(str), str, here + 'no feminine ' + str)
    t.equal(nlp('o ' + str).nouns().conjugate()[0].feminine, undefined, here + 'conjugate ' + str)
  })
  t.equal(toFem('psicólogo'), 'psicóloga', here + '-ólogo')
  t.ok(isCommon('pianista'), here + '-ista has one form')
  t.notOk(isCommon('revista'), here + 'revista')
  t.equal(nlp('a menina').nouns().conjugate()[0].feminine, 'menina', here + 'a feminine noun')
  let doc = nlp('o livro do menino')
  doc.nouns().toFeminine()
  t.equal(doc.text(), 'o livro da menina', here + 'toFeminine skips a thing')

  // number comes from the article, when the noun does not show it
  t.ok(nlp('os lápis').has('#Plural'), here + 'os lápis is plural')
  t.notOk(nlp('o lápis').has('#Plural'), here + 'o lápis is singular')
  t.notOk(nlp('o ônibus').has('#Plural'), here + 'o ônibus is singular')
  t.ok(nlp('os cafés').has('#Plural'), here + 'os cafés is plural')
  t.notOk(nlp('o país').has('#Plural'), here + 'o país is singular')
  t.ok(nlp('comprei maçãs').has('#Plural'), here + 'a plural with no article')
  // a lowercase name after an article is a noun
  t.notOk(nlp('as flores').has('#Person'), here + 'as flores')
  t.ok(nlp('a Flores').has('#Person'), here + 'a Flores')
  t.deepEqual(nlp('as flores são bonitas').nouns().conjugate(), [{ singular: 'flor', plural: 'flores' }], here + 'as flores são bonitas')

  // articles, and their contractions, follow their noun
  const arr = [
    ['do menino', 'dos meninos'],
    ['na casa', 'nas casas'],
    ['no jardim', 'nos jardins'],
    ['pelo livro', 'pelos livros'],
    ['pela rua', 'pelas ruas'],
    ['dum livro', 'duns livros'],
    ['num livro', 'nuns livros'],
    ['numa casa', 'numas casas'],
    ['ao professor', 'aos professores'],
    ['à menina', 'às meninas'],
    ['o livro do menino', 'os livros dos meninos'],
    ['moro na cidade', 'moro nas cidades'],
    ['este livro', 'estes livros'],
    ['aquela cidade', 'aquelas cidades'],
    ['meu amigo', 'meus amigos'],
    ['a minha casa e o teu carro', 'as minhas casas e os teus carros'],
    ['toda a cidade', 'todas as cidades'],
    ['O gato dorme', 'Os gatos dorme'],
    ['o lápis e o ônibus', 'os lápis e os ônibus']
  ]
  arr.forEach((a) => {
    doc = nlp(a[0])
    doc.nouns().toPlural()
    t.equal(doc.text(), a[1], here + 'toPlural ' + a[0])
    doc.nouns().toSingular()
    t.equal(doc.text(), a[0], here + 'and back ' + a[0])
    doc = nlp(a[1])
    doc.nouns().toSingular()
    t.equal(doc.text(), a[0], here + 'toSingular ' + a[1])
  })
  const fem = [
    ['do menino', 'da menina'],
    ['dos meninos', 'das meninas'],
    ['no professor', 'na professora'],
    ['pelo aluno', 'pela aluna'],
    ['dum amigo', 'duma amiga'],
    ['num amigo', 'numa amiga'],
    ['ao professor', 'à professora'],
    ['aos alunos', 'às alunas'],
    ['o meu amigo', 'a minha amiga'],
    ['este aluno e aquele professor', 'esta aluna e aquela professora'],
    ['falei com o estudante', 'falei com a estudante']
  ]
  fem.forEach((a) => {
    doc = nlp(a[0])
    doc.nouns().toFeminine()
    t.equal(doc.text(), a[1], here + 'toFeminine ' + a[0])
  })
  // 'a' is also a preposition, and a pronoun
  doc = nlp('voltei a pé')
  doc.nouns().toPlural()
  t.equal(doc.text(), 'voltei a pés', here + 'toPlural leaves a preposition')
  doc = nlp('eu a vejo na casa')
  doc.nouns().toPlural()
  t.equal(doc.text(), 'eu a vejo nas casas', here + 'toPlural skips a pronoun')
  doc = nlp('não os tenho nas caixas')
  doc.nouns().toSingular()
  t.equal(doc.text(), 'não os tenho na caixa', here + 'toSingular skips a pronoun')

  // root
  doc = nlp('as lições dos jovens ingleses').compute('root')
  t.deepEqual(doc.json()[0].terms.map((o) => o.root).filter((s) => s), ['lição', 'jovem', 'inglês'], here + 'root')
  t.end()
})
