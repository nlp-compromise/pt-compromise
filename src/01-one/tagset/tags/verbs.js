export default {
  Verb: {
    not: ['Noun', 'Adjective', 'Adverb', 'Value', 'Expression'],
  },
  PresentTense: {
    is: 'Verb',
    not: ['PastTense'],
  },
  Infinitive: {
    is: 'PresentTense',
    not: ['Gerund'],
  },
  Gerund: {
    is: 'PresentTense',
    not: ['Copula', 'FutureTense'],
  },
  PastTense: {
    is: 'Verb',
    not: ['PresentTense', 'Gerund', 'FutureTense'],
  },
  FutureTense: {
    is: 'Verb',
    not: ['PresentTense', 'Gerund', 'PastTense'],
  },
  Copula: {
    is: 'Verb',
  },
  // 'não', 'nunca' - not a verb itself
  Negative: {
    not: ['Value'],
  },
  // modals stay fully-conjugated in portuguese - 'pudesse', 'deveria'
  // so don't strip their tense tags
  Modal: {
    is: 'Auxiliary',
  },
  PerfectTense: {
    is: 'Verb',
    not: ['Gerund'],
  },
  Pluperfect: {
    is: 'Verb',
  },
  PastParticiple: {
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
    is: 'Verb',
    not: ['Conjunction'],
  },
  Conditional: {
    is: 'Verb',
    not: ['Infinitive', 'Imperative'],
  },
  // clitic pronouns - 'me', 'se', 'te', 'nos'
  Reflexive: {
    is: 'Pronoun',
  },
  // sometimes 'pretérito'
  Perfecto: {
    is: 'Verb',
  },
  // moods
  Imperative: {
    is: 'Verb',
    not: ['Subjunctive']
  },
  Subjunctive: {
    is: 'Verb',
    not: ['Imperative']
  },
  Imperfect: {
    is: 'PastTense',
    not: ['Imperative']
  },


  // 
  FirstPerson: {
    is: 'Verb',
    not: ['SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  SecondPerson: {
    is: 'Verb',
    not: ['FirstPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  ThirdPerson: {
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  FirstPersonPlural: {
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  SecondPersonPlural: {
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'ThirdPersonPlural']
  },
  ThirdPersonPlural: {
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural']
  },
}
