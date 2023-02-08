
let lex = {}

//possessive pronouns
let poss = [
  'meu',
  'meus',// (masc.)
  'minha',
  'minhas',// (fem.)	my/mine
  'teu',
  'teus',// (masc.)
  'tua',
  'tuas',// (fem.)  
  'seu',
  'seus',// (masc.)
  'sua',
  'suas',// (fem.)	your/yours (singular)
  'dele',
  'dela',	//his/hers/its
  'nosso',
  'nossos',// (masc.)
  'nossa',
  'nossas',// (fem.)	our/ours
  'vosso',
  'vossos',// (masc.)
  'vossa',
  'vossas',// (fem.)	your/yours (plural)
  'deles',
  'delas',	//their/theirs
]
poss.forEach(str => {
  lex[str] = ['Possessive', 'Pronoun']
})

const addCopulas = (arr, tag) => {
  arr.forEach(str => {
    lex[str] = lex[str] || ['Copula', tag]
  })
}
// copula ser
addCopulas(['sido'], 'PastParticiple')
addCopulas(['sendo'], 'Gerund')
addCopulas(['sê'], 'Imperative')
addCopulas(['sede'], 'Imperative')
addCopulas(['ser', 'seres', 'ser', 'sermos', 'serdes', 'serem'], 'Infinitive')
addCopulas(['sou', 'és', 'é', 'somos', 'sois', 'são'], 'PresentTense')
addCopulas(['fui', 'foste', 'foi', 'fomos', 'fostes', 'foram'], 'Preterite')
addCopulas(['era', 'eras', 'era', 'éramos', 'éreis', 'eram'], 'Imperfect')
addCopulas(['fora', 'foras', 'fora', 'fôramos', 'fôreis', 'foram'], 'Pluperfect')
addCopulas(['serei', 'serás', 'será', 'seremos', 'sereis', 'serão'], 'FutureTense')
addCopulas(['seria', 'serias', 'seria', 'seríamos', 'seríeis', 'seriam'], 'ConditionalVerb')
addCopulas(['seja', 'sejas', 'seja', 'sejamos', 'sejais', 'sejam'], 'PresentTense')// (Subjunctive)
addCopulas(['fosse', 'fosses', 'fosse', 'fôssemos', 'fôsseis', 'fossem'], 'Imperfect')// (Subjunctive)
addCopulas(['for', 'fores', 'for', 'formos', 'fordes', 'forem'], 'FutureTense')// (Subjunctive)

export default lex