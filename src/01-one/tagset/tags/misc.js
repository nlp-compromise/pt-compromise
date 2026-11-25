// only our own tags, and what differs from the shared tagset - see ../plugin.js
export default {
  Adjective: {
    aliases: [null, 'Adjetivo'],
  },
  FemaleAdjective: {
    aliases: [null, 'AdjetivoFeminino'],
    is: 'Adjective',
    not: ['MaleAdjective'],
  },
  MaleAdjective: {
    aliases: [null, 'AdjetivoMasculino'],
    is: 'Adjective',
    not: ['FemaleAdjective'],
  },
  PluralAdjective: {
    aliases: [null, 'AdjetivoPlural'],
    is: 'Adjective',
    not: ['SingularAdjective'],
  },
  SingularAdjective: {
    aliases: [null, 'AdjetivoSingular'],
    is: 'Adjective',
    not: ['PluralAdjective'],
  },
  Comparable: {
    aliases: [null, 'Comparável'],
  },
  Comparative: {
    aliases: [null, 'Comparativo'],
  },
  Superlative: {
    aliases: [null, 'Superlativo'],
  },
  NumberRange: {
    aliases: [null, 'IntervaloNumérico'],
  },
  Adverb: {
    aliases: [null, 'Advérbio'],
  },
  Determiner: {
    aliases: [null, 'Determinante', 'Artigo'],
    not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord', 'Conjunction', 'Preposition'],
  },
  Conjunction: {
    aliases: [null, 'Conjunção'],
    is: undefined,
    not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord'],
  },
  Preposition: {
    aliases: [null, 'Preposição'],
    is: undefined,
    not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord'],
  },
  QuestionWord: {
    aliases: [null, 'Interrogativo'],
  },
  Currency: {
    aliases: [null, 'Moeda'],
  },
  Expression: {
    aliases: [null, 'Interjeição'],
    not: ['Noun', 'Adjective', 'Verb', 'Adverb', 'Conjunction'],
  },
  Abbreviation: {
    aliases: [null, 'Abreviatura'],
  },
  Url: {
    not: ['HashTag', 'PhoneNumber', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
  },
  PhoneNumber: {
    aliases: [null, 'Telefone'],
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
  },
  HashTag: {
  },
  AtMention: {
    aliases: [null, 'Menção'],
    not: ['HashTag', 'Email'],
  },
  Emoji: {
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
  },
  Emoticon: {
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
  },
  Email: {
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
  },
  Acronym: {
    aliases: [null, 'Acrônimo'],
    not: ['Plural', 'RomanNumeral'],
  },
  Condition: {
    aliases: [null, 'Condição'],
    is: undefined,
  },
}
