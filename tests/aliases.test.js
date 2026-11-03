import test from 'tape'
import nlp from './_lib.js'
const here = '[pt-aliases] '

// every alias, and the tag it stands for
const aliases = {
  // nouns
  Substantivo: 'Noun',
  NomePróprio: 'ProperNoun',
  Pessoa: 'Person',
  PrimeiroNome: 'FirstName',
  NomeMasculino: 'MaleName',
  NomeFeminino: 'FemaleName',
  Sobrenome: 'LastName',
  Título: 'Honorific',
  Lugar: 'Place',
  País: 'Country',
  Cidade: 'City',
  Região: 'Region',
  Endereço: 'Address',
  Organização: 'Organization',
  Equipe: 'SportsTeam',
  Escola: 'School',
  Empresa: 'Company',
  Incontável: 'Uncountable',
  Reflexivo: 'Reflexive',
  Pronome: 'Pronoun',
  Atividade: 'Activity',
  Unidade: 'Unit',
  Gentílico: 'Demonym',
  Possessivo: 'Possessive',
  SubstantivoMasculino: 'MaleNoun',
  SubstantivoFeminino: 'FemaleNoun',
  // verbs
  Verbo: 'Verb',
  Presente: 'PresentTense',
  Infinitivo: 'Infinitive',
  Imperativo: 'Imperative',
  Gerúndio: 'Gerund',
  Passado: 'PastTense',
  Particípio: 'PastParticiple',
  Imperfeito: 'Imperfect',
  Futuro: 'FutureTense',
  Cópula: 'Copula',
  PretéritoPerfeito: 'PerfectTense',
  MaisQuePerfeito: 'Pluperfect',
  Auxiliar: 'Auxiliary',
  Condicional: 'Conditional',
  Subjuntivo: 'Subjunctive',
  Negação: 'Negative',
  PrimeiraPessoa: 'FirstPerson',
  SegundaPessoa: 'SecondPerson',
  TerceiraPessoa: 'ThirdPerson',
  PrimeiraPessoaPlural: 'FirstPersonPlural',
  SegundaPessoaPlural: 'SecondPersonPlural',
  TerceiraPessoaPlural: 'ThirdPersonPlural',
  // values
  Número: 'Value',
  Fração: 'Fraction',
  Múltiplo: 'Multiple',
  NúmeroRomano: 'RomanNumeral',
  Numeral: 'TextValue',
  Numérico: 'NumericValue',
  Dinheiro: 'Money',
  Porcentagem: 'Percent',
  // dates
  Data: 'Date',
  Mês: 'Month',
  DiaDaSemana: 'WeekDay',
  Ano: 'Year',
  Trimestre: 'FinancialQuarter',
  Feriado: 'Holiday',
  Estação: 'Season',
  FusoHorário: 'Timezone',
  Hora: 'Time',
  Duração: 'Duration',
  // misc
  Adjetivo: 'Adjective',
  AdjetivoFeminino: 'FemaleAdjective',
  AdjetivoMasculino: 'MaleAdjective',
  AdjetivoPlural: 'PluralAdjective',
  AdjetivoSingular: 'SingularAdjective',
  Comparável: 'Comparable',
  Comparativo: 'Comparative',
  Superlativo: 'Superlative',
  IntervaloNumérico: 'NumberRange',
  Advérbio: 'Adverb',
  Determinante: 'Determiner',
  Artigo: 'Determiner',
  Conjunção: 'Conjunction',
  Preposição: 'Preposition',
  Interrogativo: 'QuestionWord',
  Moeda: 'Currency',
  Interjeição: 'Expression',
  Abreviatura: 'Abbreviation',
  Telefone: 'PhoneNumber',
  Menção: 'AtMention',
  Acrônimo: 'Acronym',
  Condição: 'Condition',
}

test('aliases point to the right tag:', function (t) {
  const { tagAliases } = nlp.world().model.one
  Object.keys(aliases).forEach(alias => {
    t.equal(tagAliases[alias], aliases[alias], here + `#${alias} is #${aliases[alias]}`)
  })
  t.end()
})

test('aliases match a tagged term:', function (t) {
  Object.keys(aliases).forEach(alias => {
    const doc = nlp('o carro').tag(aliases[alias])
    t.ok(doc.has(`#${alias}`), here + `#${alias} finds a #${aliases[alias]}`)
  })
  t.end()
})

test('every alias in the tagset is tested, and titlecase:', function (t) {
  const { tagSet } = nlp.world().model.one
  Object.keys(tagSet).forEach(tag => {
    const names = (tagSet[tag].aliases || []).filter(name => name !== null)
    names.forEach(name => {
      t.equal(aliases[name], tag, here + `#${name} is listed for #${tag}`)
      t.ok(/^\p{Lu}/u.test(name), here + `#${name} is titlecase`)
    })
  })
  t.end()
})

test('aliases match real sentences:', function (t) {
  const arr = [
    ['O rato comeu o queijo', '#Artigo #Substantivo #Verbo #Determinante #Substantivo'],
    ['o carro é branco', '#Artigo #Substantivo #Cópula #Adjetivo'],
    ['meu', '#Possessivo'],
    ['spencer', '#Pessoa'],
    ['tony', '#NomeMasculino'],
    ['chicago', '#Cidade'],
    ['chicago', '#Lugar'],
    ['babei', '#Passado'],
    ['estado', '#Particípio'],
    ['ia', '#Imperfeito'],
    ['babarei', '#Futuro'],
    ['fora', '#MaisQuePerfeito'],
    ['babaria', '#Condicional'],
    ['babasse', '#Subjuntivo'],
    ['babando', '#Gerúndio'],
    ['babamos', '#PrimeiraPessoaPlural'],
    ['babam', '#TerceiraPessoaPlural'],
    ['não', '#Negação'],
    ['alta', '#AdjetivoFeminino'],
    ['dourados', '#AdjetivoMasculino'],
    ['negros', '#AdjetivoPlural'],
    ['fria', '#AdjetivoSingular'],
    ['234', '#Número'],
    ['234', '#Numérico'],
    ['junho', '#Mês'],
    ['junho', '#Data'],
  ]
  arr.forEach(function (a) {
    const [str, match] = a
    const doc = nlp(str)
    const tags = doc.json()[0].terms.map(term => term.tags[0])
    const msg = `'${(str + "' ").padEnd(20, ' ')}  - '${match}' - '${tags.join(', ')}'`
    t.equal(doc.match(match).text(), doc.text(), here + msg)
  })
  t.end()
})

test('aliases work in match syntax:', function (t) {
  const doc = nlp('o carro')
  const [det, noun] = doc.json()[0].terms.map(term => term.text)
  // lowercase is title-cased, as with any tag
  t.ok(doc.has('#substantivo'), here + 'lowercase')
  t.ok(nlp('em casa').has('#preposição'), here + 'lowercase preposition')
  t.equal(doc.match('!#Substantivo').text(), det, here + 'negative')
  t.equal(doc.match('(#Auxiliar|#Determinante) #Substantivo').text(), doc.text(), here + 'or-block')
  t.equal(doc.match('#Determinante [#Substantivo]', 0).text(), noun, here + 'capture')
  t.equal(doc.match('#Determinante #Adjetivo? #Substantivo').text(), doc.text(), here + 'optional')
  t.equal(doc.not('#Determinante').text(), noun, here + 'not()')
  t.equal(doc.if('#Substantivo').length, 1, here + 'if()')
  t.end()
})

test('aliases do not over-match:', function (t) {
  const doc = nlp('o carro')
  t.notOk(doc.has('#Auxiliar'), here + 'no #Auxiliar')
  t.notOk(doc.has('#Preposição'), here + 'no #Preposição')
  t.notOk(doc.has('#Bobagem'), here + 'an unknown tag finds nothing')
  t.end()
})

test('aliases can also set tags:', function (t) {
  const doc = nlp('o carro').tag('Auxiliar')
  t.ok(doc.has('#Auxiliary'), here + 'tag() with an alias')
  doc.unTag('Auxiliar')
  t.notOk(doc.has('#Auxiliary'), here + 'unTag() with an alias')
  t.end()
})

test('english tag names are unchanged:', function (t) {
  const doc = nlp('o carro')
  t.ok(doc.has('#Determiner #Noun'), here + 'canonical names still match')
  t.ok(doc.out('spec').includes('{Determiner,Noun}'), here + 'spec output is canonical')
  const tags = doc.json()[0].terms[1].tags
  t.ok(tags.includes('Noun'), here + 'json has #Noun')
  t.notOk(tags.includes('Substantivo'), here + 'json has no #Substantivo')
  t.end()
})
