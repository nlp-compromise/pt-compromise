// only our own tags, and what differs from the shared tagset - see ../plugin.js
export default {
  Verb: {
    aliases: [null, 'Verbo'],
  },
  PresentTense: {
    aliases: [null, 'Presente'],
    not: ['PastTense'],
  },
  Infinitive: {
    aliases: [null, 'Infinitivo'],
  },
  Gerund: {
    aliases: [null, 'Gerúndio'],
    not: ['Copula', 'FutureTense'],
  },
  PastTense: {
    aliases: [null, 'Passado'],
  },
  FutureTense: {
    aliases: [null, 'Futuro'],
    not: ['PresentTense', 'Gerund', 'PastTense'],
  },
  Copula: {
    aliases: [null, 'Cópula'],
  },
  Negative: {
    aliases: [null, 'Negação'],
    not: ['Value'],
  },
  Modal: {
    is: 'Auxiliary',
    not: undefined,
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
  },
  Particle: {
  },
  Auxiliary: {
    aliases: [null, 'Auxiliar'],
    not: ['Conjunction'],
  },
  Conditional: {
    aliases: [null, 'Condicional'],
    is: 'Verb',
    not: ['Infinitive', 'Imperative'],
  },
  Reflexive: {
    aliases: [null, 'Reflexivo'],
  },
  Perfecto: {
    is: 'Verb',
  },
  Imperative: {
    aliases: [null, 'Imperativo'],
    not: ['Subjunctive'],
  },
  Subjunctive: {
    aliases: [null, 'Subjuntivo'],
    is: 'Verb',
    not: ['Imperative'],
  },
  Imperfect: {
    aliases: [null, 'Imperfeito'],
    is: 'PastTense',
    not: ['Imperative'],
  },
  FirstPerson: {
    aliases: [null, 'PrimeiraPessoa'],
    is: 'Verb',
    not: ['SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'],
  },
  SecondPerson: {
    aliases: [null, 'SegundaPessoa'],
    is: 'Verb',
    not: ['FirstPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'],
  },
  ThirdPerson: {
    aliases: [null, 'TerceiraPessoa'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'],
  },
  FirstPersonPlural: {
    aliases: [null, 'PrimeiraPessoaPlural'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'SecondPersonPlural', 'ThirdPersonPlural'],
  },
  SecondPersonPlural: {
    aliases: [null, 'SegundaPessoaPlural'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'ThirdPersonPlural'],
  },
  ThirdPersonPlural: {
    aliases: [null, 'TerceiraPessoaPlural'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural'],
  },
}
