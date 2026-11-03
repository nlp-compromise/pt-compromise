export default {
  Date: {
    aliases: [null, 'Data'],
    not: ['Verb', 'Adverb', 'Adjective'],
  },
  Month: {
    aliases: [null, 'Mês'],
    is: 'Singular',
    also: ['Date'],
    not: ['Year', 'WeekDay', 'Time'],
  },
  WeekDay: {
    aliases: [null, 'DiaDaSemana'],
    is: 'Noun',
    also: ['Date'],
  },
  Year: {
    aliases: [null, 'Ano'],
    is: 'Date',
    not: ['RomanNumeral'],
  },
  FinancialQuarter: {
    aliases: [null, 'Trimestre'],
    is: 'Date',
    not: 'Fraction',
  },
  // 'easter'
  Holiday: {
    aliases: [null, 'Feriado'],
    is: 'Date',
    also: ['Noun'],
  },
  // 'summer'
  Season: {
    aliases: [null, 'Estação'],
    is: 'Date',
  },
  Timezone: {
    aliases: [null, 'FusoHorário'],
    is: 'Noun',
    also: ['Date'],
    not: ['ProperNoun'],
  },
  Time: {
    aliases: [null, 'Hora'],
    is: 'Date',
    not: ['AtMention'],
  },
  // 'months'
  Duration: {
    aliases: [null, 'Duração'],
    is: 'Noun',
    also: ['Date'],
  },
}
