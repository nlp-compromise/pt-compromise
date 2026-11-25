// only our own tags, and what differs from the shared tagset - see ../plugin.js
export default {
  Noun: {
    aliases: [null, 'Substantivo'],
  },
  Singular: {
    not: ['Plural'],
  },
  ProperNoun: {
    aliases: [null, 'NomePróprio'],
  },
  Person: {
    aliases: [null, 'Pessoa'],
  },
  FirstName: {
    aliases: [null, 'PrimeiroNome'],
  },
  MaleName: {
    aliases: [null, 'NomeMasculino'],
  },
  FemaleName: {
    aliases: [null, 'NomeFeminino'],
  },
  LastName: {
    aliases: [null, 'Sobrenome'],
  },
  Honorific: {
    aliases: [null, 'Título'],
    is: 'Noun',
  },
  Place: {
    aliases: [null, 'Lugar'],
  },
  Country: {
    aliases: [null, 'País'],
  },
  City: {
    aliases: [null, 'Cidade'],
  },
  Region: {
    aliases: [null, 'Região'],
  },
  Address: {
    aliases: [null, 'Endereço'],
  },
  Organization: {
    aliases: [null, 'Organização'],
  },
  SportsTeam: {
    aliases: [null, 'Equipe'],
  },
  School: {
    aliases: [null, 'Escola'],
  },
  Company: {
    aliases: [null, 'Empresa'],
  },
  Plural: {
    not: ['Singular'],
  },
  Uncountable: {
    aliases: [null, 'Incontável'],
  },
  Pronoun: {
    aliases: [null, 'Pronome'],
  },
  Actor: {
    not: ['Person', 'Place', 'Organization'],
  },
  Activity: {
    aliases: [null, 'Atividade'],
  },
  Unit: {
    aliases: [null, 'Unidade'],
  },
  Demonym: {
    aliases: [null, 'Gentílico'],
  },
  Possessive: {
    aliases: [null, 'Possessivo'],
  },
  FemaleNoun: {
    aliases: [null, 'SubstantivoFeminino'],
    is: 'Noun',
    not: ['MaleNoun'],
  },
  MaleNoun: {
    aliases: [null, 'SubstantivoMasculino'],
    is: 'Noun',
    not: ['FemaleNoun'],
  },
}
