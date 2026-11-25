// portuguese word-rules for .clauses() - the method itself comes from compromise/shared
const clauses = {
  // a comma, but not a clause break
  notClause: [
    '@hasComma (e|ou) .', // grande, e forte
  ],
  // split a clause after these
  splitAfter: [
    '^#Pron (disse|diz)', // ele disse
  ],
  // split a clause before these
  splitBefore: [
    '(disse|diz) #Prop$',
    'e enquanto',
    'agora que',
    'desde que',
    'até que',
    'embora',
    'mesmo (se|que|quando)',
    'como se',
    'enquanto', // while, whereas
    '(cujo|cuja|cujos|cujas)', // whose
  ],
  // split a clause before the [captured] word
  splitBeforeGroup: [
    '#Verb .* [mas] .* #Verb', // é bom mas é ..
    'se .{2,9} [então] .', // se é isto então aquilo
  ],
}

export default {
  model: { three: { clauses } },
}
