// abbreviations, and the other language-specific parts of the sentence-parser
// (these replace the english abbreviations, which collide with real words here)
const toObj = str => Object.fromEntries(str.trim().split(/\s+/).map(w => [w, true]))

export default {
  // these go before a name, a number or a letter ('Dr. X', 'fig. A'), and never end a sentence
  titles: toObj(`
    sr sra srs sras srta dr dra drs dras prof profa profs eng arq
    exa exmo exma ilmo ilma pe sto sta gen cel cap ten sgt maj
    av cia trav vs depto dep univ ed séc p n
    pág págs art vol fig tab núm ref
  `),
  // these end a sentence, when a capital comes next
  abbreviations: toObj(`
    ex tel ltda aprox obs doc etc
    seg qua qui sex
    jan fev abr mai jun jul ago out nov dez
  `),
  // 'ter', 'dom', 'set' and 'mar' are real words - 'ele quer ter.'
  conditional: /(?:(?:^|\s)(?:na|no|à|às|toda|todo) (?:ter|dom)|(?:\d de|(?:^|\s)em) (?:set|mar))\. *$/i,
  // longer ones, that end a sentence when a capital comes next
  enders: ['[ad]\\.C', 'S\\.\\s?A', '[ap]\\.\\s?m'],
  // '5 kg.'
  units: ['kg', 'km', 'cm', 'mm', 'ml', 'g', 'm', 'l', 'h', 'min'],
  // words that begin a new sentence, and are never a name - 'Habla con el Dr. Él sabe.'
  starters: `Ele Ela Eles Elas Eu Tu Nós Você Depois Então Mas Não Sim Era Foi Está Estava
    Há Tem Vamos Seu Sua Meu Minha Me Se Ninguém Nada Tudo Todos
    Hoje Ontem Amanhã Agora Aqui Ali Lá Também Quando Como Que Quem Onde Por`.split(/\s+/),
  quotes: [['«', '»'], ['“', '”'], ['"', '"'], ['(', ')']],
  ellipsis: true,
}
