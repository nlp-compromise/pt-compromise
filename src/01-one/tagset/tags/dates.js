// only our own tags, and what differs from the shared tagset - see ../plugin.js
export default {
  Date: {
    aliases: [null, 'Data'],
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
    not: undefined,
  },
  Year: {
    aliases: [null, 'Ano'],
    not: ['RomanNumeral'],
  },
  FinancialQuarter: {
    aliases: [null, 'Trimestre'],
    not: 'Fraction',
  },
  Holiday: {
    aliases: [null, 'Feriado'],
  },
  Season: {
    aliases: [null, 'Estação'],
    not: undefined,
  },
  Timezone: {
    aliases: [null, 'FusoHorário'],
    is: 'Noun',
    also: ['Date'],
  },
  Time: {
    aliases: [null, 'Hora'],
    not: ['AtMention'],
  },
  Duration: {
    aliases: [null, 'Duração'],
    is: 'Noun',
    also: ['Date'],
  },
}
