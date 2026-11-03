const anything = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord']

export default {
  Adjective: {
    aliases: [null, 'Adjetivo'],
    not: ['Noun', 'Verb', 'Adverb', 'Value']
  },
  FemaleAdjective: {
    aliases: [null, 'AdjetivoFeminino'],
    is: 'Adjective',
    not: ['MaleAdjective']
  },
  MaleAdjective: {
    aliases: [null, 'AdjetivoMasculino'],
    is: 'Adjective',
    not: ['FemaleAdjective']
  },
  PluralAdjective: {
    aliases: [null, 'AdjetivoPlural'],
    is: 'Adjective',
    not: ['SingularAdjective']
  },
  SingularAdjective: {
    aliases: [null, 'AdjetivoSingular'],
    is: 'Adjective',
    not: ['PluralAdjective']
  },
  Comparable: {
    aliases: [null, 'Comparável'],
    is: 'Adjective'
  },
  Comparative: {
    aliases: [null, 'Comparativo'],
    is: 'Adjective'
  },
  Superlative: {
    aliases: [null, 'Superlativo'],
    is: 'Adjective',
    not: ['Comparative']
  },
  NumberRange: {
    aliases: [null, 'IntervaloNumérico'],
  },
  Adverb: {
    aliases: [null, 'Advérbio'],
    not: ['Noun', 'Verb', 'Adjective', 'Value']
  },

  Determiner: {
    aliases: [null, 'Determinante', 'Artigo'],
    not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord', 'Conjunction', 'Preposition'] //allow 'a' to be a Determiner/Value
  },
  Conjunction: {
    aliases: [null, 'Conjunção'],
    not: anything
  },
  Preposition: {
    aliases: [null, 'Preposição'],
    not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord']
  },
  QuestionWord: {
    aliases: [null, 'Interrogativo'],
    not: ['Determiner']
  },
  Currency: {
    aliases: [null, 'Moeda'],
    is: 'Noun'
  },
  Expression: {
    aliases: [null, 'Interjeição'],
    not: ['Noun', 'Adjective', 'Verb', 'Adverb', 'Conjunction']
  },
  Abbreviation: {
    aliases: [null, 'Abreviatura'],
  },
  Url: {
    not: ['HashTag', 'PhoneNumber', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email']
  },
  PhoneNumber: {
    aliases: [null, 'Telefone'],
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email']
  },
  HashTag: {},
  AtMention: {
    aliases: [null, 'Menção'],
    is: 'Noun',
    not: ['HashTag', 'Email']
  },
  Emoji: {
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention']
  },
  Emoticon: {
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention']
  },
  Email: {
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention']
  },
  Acronym: {
    aliases: [null, 'Acrônimo'],
    not: ['Plural', 'RomanNumeral']
  },
  Condition: {
    aliases: [null, 'Condição'],
    not: ['Verb', 'Adjective', 'Noun', 'Value']
  }
}
