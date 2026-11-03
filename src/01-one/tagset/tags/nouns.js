const entity = ['Person', 'Place', 'Organization']

export default {
  Noun: {
    aliases: [null, 'Substantivo'],
    not: ['Verb', 'Adjective', 'Adverb', 'Value', 'Determiner'],
  },
  Singular: {
    is: 'Noun',
    not: ['Plural'],
  },
  ProperNoun: {
    aliases: [null, 'NomePróprio'],
    is: 'Noun',
  },
  Person: {
    aliases: [null, 'Pessoa'],
    is: 'Singular',
    also: ['ProperNoun'],
    not: ['Place', 'Organization', 'Date'],
  },
  FirstName: {
    aliases: [null, 'PrimeiroNome'],
    is: 'Person',
  },
  MaleName: {
    aliases: [null, 'NomeMasculino'],
    is: 'FirstName',
    not: ['FemaleName', 'LastName'],
  },
  FemaleName: {
    aliases: [null, 'NomeFeminino'],
    is: 'FirstName',
    not: ['MaleName', 'LastName'],
  },
  LastName: {
    aliases: [null, 'Sobrenome'],
    is: 'Person',
    not: ['FirstName'],
  },
  Honorific: {
    aliases: [null, 'Título'],
    is: 'Noun',
    not: ['FirstName', 'LastName', 'Value'],
  },
  Place: {
    aliases: [null, 'Lugar'],
    is: 'Singular',
    not: ['Person', 'Organization'],
  },
  Country: {
    aliases: [null, 'País'],
    is: 'Place',
    also: ['ProperNoun'],
    not: ['City'],
  },
  City: {
    aliases: [null, 'Cidade'],
    is: 'Place',
    also: ['ProperNoun'],
    not: ['Country'],
  },
  Region: {
    aliases: [null, 'Região'],
    is: 'Place',
    also: ['ProperNoun'],
  },
  Address: {
    aliases: [null, 'Endereço'],
    // is: 'Place',
  },
  Organization: {
    aliases: [null, 'Organização'],
    is: 'ProperNoun',
    not: ['Person', 'Place'],
  },
  SportsTeam: {
    aliases: [null, 'Equipe'],
    is: 'Organization',
  },
  School: {
    aliases: [null, 'Escola'],
    is: 'Organization',
  },
  Company: {
    aliases: [null, 'Empresa'],
    is: 'Organization',
  },
  Plural: {
    is: 'Noun',
    not: ['Singular'],
  },
  Uncountable: {
    aliases: [null, 'Incontável'],
    is: 'Noun',
  },
  Pronoun: {
    aliases: [null, 'Pronome'],
    is: 'Noun',
    not: entity,
  },
  Actor: {
    is: 'Noun',
    not: entity,
  },
  Activity: {
    aliases: [null, 'Atividade'],
    is: 'Noun',
    not: ['Person', 'Place'],
  },
  Unit: {
    aliases: [null, 'Unidade'],
    is: 'Noun',
    not: entity,
  },
  Demonym: {
    aliases: [null, 'Gentílico'],
    is: 'Noun',
    also: ['ProperNoun'],
    not: entity,
  },
  Possessive: {
    aliases: [null, 'Possessivo'],
    is: 'Noun',
  },

  FemaleNoun: {
    aliases: [null, 'SubstantivoFeminino'],
    is: 'Noun',
    not: ['MaleNoun']
  },
  MaleNoun: {
    aliases: [null, 'SubstantivoMasculino'],
    is: 'Noun',
    not: ['FemaleNoun']
  },

}
