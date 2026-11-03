export default {
  Verb: {
    aliases: [null, 'Verbo'],
    not: ['Noun', 'Adjective', 'Adverb', 'Value', 'Expression'],
  },
  PresentTense: {
    aliases: [null, 'Presente'],
    is: 'Verb',
    not: ['PastTense'],
  },
  Infinitive: {
    aliases: [null, 'Infinitivo'],
    is: 'PresentTense',
    not: ['Gerund'],
  },
  Gerund: {
    aliases: [null, 'Gerúndio'],
    is: 'PresentTense',
    not: ['Copula', 'FutureTense'],
  },
  PastTense: {
    aliases: [null, 'Passado'],
    is: 'Verb',
    not: ['PresentTense', 'Gerund', 'FutureTense'],
  },
  FutureTense: {
    aliases: [null, 'Futuro'],
    is: 'Verb',
    not: ['PresentTense', 'Gerund', 'PastTense'],
  },
  Copula: {
    aliases: [null, 'Cópula'],
    is: 'Verb',
  },
  // 'não', 'nunca' - not a verb itself
  Negative: {
    aliases: [null, 'Negação'],
    not: ['Value'],
  },
  // modals stay fully-conjugated in portuguese - 'pudesse', 'deveria'
  // so don't strip their tense tags
  Modal: {
    is: 'Auxiliary',
  },
  PerfectTense: {
    aliases: [null, 'PretéritoPerfeito'],
    is: 'Verb',
    not: ['Gerund'],
  },
  Pluperfect: {
    aliases: [null, 'MaisQuePerfeito'],
    is: 'Verb',
  },
  PastParticiple: {
    aliases: [null, 'Particípio'],
    is: 'PastTense',
  },
  PhrasalVerb: {
    is: 'Verb',
  },
  Particle: {
    is: 'PhrasalVerb',
    not: ['PastTense', 'PresentTense', 'Copula', 'Gerund'],
  },
  Auxiliary: {
    aliases: [null, 'Auxiliar'],
    is: 'Verb',
    not: ['Conjunction'],
  },
  Conditional: {
    aliases: [null, 'Condicional'],
    is: 'Verb',
    not: ['Infinitive', 'Imperative'],
  },
  // clitic pronouns - 'me', 'se', 'te', 'nos'
  Reflexive: {
    aliases: [null, 'Reflexivo'],
    is: 'Pronoun',
  },
  // sometimes 'pretérito'
  Perfecto: {
    is: 'Verb',
  },
  // moods
  Imperative: {
    aliases: [null, 'Imperativo'],
    is: 'Verb',
    not: ['Subjunctive']
  },
  Subjunctive: {
    aliases: [null, 'Subjuntivo'],
    is: 'Verb',
    not: ['Imperative']
  },
  Imperfect: {
    aliases: [null, 'Imperfeito'],
    is: 'PastTense',
    not: ['Imperative']
  },


  // 
  FirstPerson: {
    aliases: [null, 'PrimeiraPessoa'],
    is: 'Verb',
    not: ['SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  SecondPerson: {
    aliases: [null, 'SegundaPessoa'],
    is: 'Verb',
    not: ['FirstPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  ThirdPerson: {
    aliases: [null, 'TerceiraPessoa'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  FirstPersonPlural: {
    aliases: [null, 'PrimeiraPessoaPlural'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  SecondPersonPlural: {
    aliases: [null, 'SegundaPessoaPlural'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'ThirdPersonPlural']
  },
  ThirdPersonPlural: {
    aliases: [null, 'TerceiraPessoaPlural'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural']
  },
}
