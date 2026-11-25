// everything portuguese that article-clitic.js needs to know
const set = (str) => new Set(str.split(','))
// masculine nouns in '-a'
const maleA = '([eoa]ma|ista|^(dia|mapa|planeta|cometa|clima|samba|panda|gorila|guarda|colega|atleta|poeta|papa|nada))'
const none = /^$/

export default {
  // 'not' are endings that a noun can not have, after this article - 'but' are its exceptions
  articles: {
    o: { plural: false, not: /[as]$/, but: new RegExp(maleA + '$|ês$') },
    a: { plural: false, not: /[os]$/, but: /(ão|^(foto|moto|tribo|libido))$/ },
    os: { plural: true, not: /([^sx]|as)$/, but: new RegExp(maleA + 's$') },
    as: { plural: true, not: /([^sx]|os)$/, but: /^(foto|moto|tribo|libido)s$/ },
    um: { plural: false, not: none, but: none },
    uma: { plural: false, not: none, but: none },
    uns: { plural: true, not: none, but: none },
    umas: { plural: true, not: none, but: none }
  },
  // 'o', 'a', 'os', 'as' are object-pronouns too - 'eu a vejo'
  clitics: set('o,a,os,as'),
  // words that an object-pronoun follows - 'não a vejo', 'ela o conta'
  verbBefore: set('não,nunca,jamais,nem,eu,tu,ele,ela,você,nós,vós,eles,elas,vocês,quem,ninguém,alguém'),
  // .. or a noun - 'se a conta é alta', but 'se a compra'
  clauseBefore: set('que,se,quando,porque,onde,como,enquanto,embora,já,também,sempre,ainda,só,talvez,aqui,agora,hoje,logo'),
  joins: set('e,ou,mas'),
  // 'todos os dias', 'toda a gente'
  quantifiers: { todo: 'o', toda: 'a', todos: 'os', todas: 'as', ambos: 'os', ambas: 'as' },
  // 'a venda da casa'
  nounAfter: set('de'),
  // 'vende', 'conheces' are verbs - '-er' and '-ir' verbs do not make nouns like 'a compra', 'o canto'
  verbEnding: /es?$/,
  // 'os lápis', 'os tórax'
  pluralEnding: /[sx]$/,
  // these are adverbs, or pronouns, in the lexicon - 'a tarde', 'o bem', 'os nós'
  nouns: set('tarde,bem,mal,sede,nós'),
  nonFinite: ['Infinitive', 'Gerund', 'PastParticiple'],
  // 'o jantar', 'os poderes', 'o namorado'
  nounForm: ['Infinitive', 'PastParticiple'],
  // forms that want a 'que', or a 'não' - 'que o faça'
  weak: ['Subjunctive', 'Imperative'],
  present: ['PresentTense'],
  pluralPerson: ['FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'],
  // 'a canta muito bem', 'a paga o João'
  afterVerb: ['Adverb', 'Determiner', 'Value', 'ProperNoun', 'Pronoun', 'Date'],
  // tags of a word that may also be a verb-form - 'conta', 'limpa', 'como'
  homograph: ['Noun', 'Adjective', 'Conjunction'],
  // 'a era', 'o ser'
  skip: ['Copula', 'Auxiliary', 'Pronoun', 'Value'],
  // 'vejo-a', 'dar-lhe-ei'
  hyphen: true,
  // .. but can not begin a sentence - 'O vejo'
  initial: false,
  isNoun: function (str, world) {
    const lexicon = world.model.one.lexicon
    return /^(Noun|Plural)$/.test(lexicon[str]) || lexicon[world.methods.two.transform.noun.fromPlural(str)] === 'Noun'
  },
  getVerb: (term, world) => world.model.two.verbForms[term.normal] || null
}
