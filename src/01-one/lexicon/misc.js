
let lex = {
  'não': 'Negative',
  'nunca': 'Negative',
  // 'quê': 'QuestionWord',//what?
  'o que': 'QuestionWord',//what?
  'quem': 'QuestionWord',//who?
  'qual': 'QuestionWord',//which?
  'porquê': 'QuestionWord',//why?
  'quando': 'QuestionWord',//when?
  'onde': 'QuestionWord',//where?
  // 'como': 'QuestionWord',//how?
  'quanto': 'QuestionWord',
  'quão': 'QuestionWord',
  'termos': '#Verb'
}

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

const forms = ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
const addCopulas = (arr, tag) => {
  arr.forEach((str, i) => {
    lex[str] = lex[str] || ['Copula', forms[i], tag]
  })
}
// copula ser
lex['sido'] = ['PastParticiple', 'Copula']
lex['sendo'] = ['Gerund', 'Copula']
lex['sê'] = ['Imperative', 'Copula', 'SecondPerson']
lex['sede'] = ['Imperative', 'Copula', 'SecondPersonPlural']
addCopulas(['ser', 'seres', 'ser', 'sermos', 'serdes', 'serem'], 'Infinitive')
addCopulas(['sou', 'és', 'é', 'somos', 'sois', 'são'], 'PresentTense')
addCopulas(['fui', 'foste', 'foi', 'fomos', 'fostes', 'foram'], 'PastTense')
addCopulas(['era', 'eras', 'era', 'éramos', 'éreis', 'eram'], 'Imperfect')
addCopulas(['fora', 'foras', 'fora', 'fôramos', 'fôreis', 'foram'], 'Pluperfect')
addCopulas(['serei', 'serás', 'será', 'seremos', 'sereis', 'serão'], 'FutureTense')
addCopulas(['seria', 'serias', 'seria', 'seríamos', 'seríeis', 'seriam'], 'ConditionalVerb')
addCopulas(['seja', 'sejas', 'seja', 'sejamos', 'sejais', 'sejam'], 'PresentTense')// (Subjunctive)
addCopulas(['fosse', 'fosses', 'fosse', 'fôssemos', 'fôsseis', 'fossem'], 'Imperfect')// (Subjunctive)
addCopulas(['for', 'fores', 'for', 'formos', 'fordes', 'forem'], 'FutureTense')// (Subjunctive)

// copula estar
lex['estado'] = ['PastParticiple', 'Copula']
lex['estando'] = ['Gerund', 'Copula']
lex['está'] = ['Imperative', 'Copula', 'SecondPerson']
lex['estai'] = ['Imperative', 'Copula', 'SecondPersonPlural']
addCopulas(['estar', 'estares', 'estar', 'estarmos', 'estardes', 'estarem'], 'Infinitive')
addCopulas(['estou', 'estás', 'está', 'estamos', 'estais', 'estão'], 'PresentTense')
addCopulas(['estive', 'estiveste', 'esteve', 'estivemos', 'estivestes', 'estiveram'], 'PastTense')
addCopulas(['estava', 'estavas', 'estava', 'estávamos', 'estáveis', 'estavam'], 'Imperfect')
addCopulas(['estivera', 'estiveras', 'estivera', 'estivéramos', 'estivéreis', 'estiveram'], 'Pluperfect')
addCopulas(['estarei', 'estarás', 'estará', 'estaremos', 'estareis', 'estarão'], 'FutureTense')
addCopulas(['estaria', 'estarias', 'estaria', 'estaríamos', 'estaríeis', 'estariam'], 'ConditionalVerb')
addCopulas(['esteja', 'estejas', 'esteja', 'estejamos', 'estejais', 'estejam'], 'PresentTense')
addCopulas(['estivesse', 'estivesses', 'estivesse', 'estivéssemos', 'estivésseis', 'estivessem'], 'Imperfect')
addCopulas(['estiver', 'estiveres', 'estiver', 'estivermos', 'estiverdes', 'estiverem'], 'FutureTense')


export default lex
