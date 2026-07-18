// portuguese suffix-patterns, for guessing the tag of unknown words
// (only applied to words that received no tag from the lexicon)
const rb = 'Adverb'
const nn = 'Noun'
const jj = 'Adjective'
const g = 'Gerund'
const inf = 'Infinitive'
const past = 'PastTense'
const imp = 'Imperfect'
const fut = 'FutureTense'
const cond = 'Conditional'
const subj = 'Subjunctive'
const pp = 'PastParticiple'

export default [
  null,
  {
    // one-letter suffixes
  },
  {
    // two-letter suffixes
    ou: past, // falou, chegou
    iu: past, // partiu, caiu
    ei: past, // falei, comprei
  },
  {
    // three-letter suffixes
    'ção': nn, // nação
    'são': nn, // decisão
    oso: jj, // famoso
    osa: jj,
    ivo: jj, // ativo
    iva: jj,
    vel: jj, // amável, possível
    ndo: g, // falando, comendo, pondo
    ava: imp, // falava
    ado: pp, // falado
    ido: pp, // comido
    'ará': fut, // falará
    'erá': fut,
    'irá': fut,
  },
  {
    // four-letter suffixes
    'ções': nn, // nações
    'sões': nn, // decisões
    dade: nn, // verdade, cidade
    agem: nn, // viagem, coragem
    ismo: nn, // otimismo
    ista: nn, // dentista
    'ável': jj, // notável
    'ível': jj, // incrível
    ante: jj, // interessante
    ente: jj, // diferente
    izar: inf, // modernizar
    ecer: inf, // envelhecer
    ejar: inf, // desejar
    avam: imp, // falavam
    aram: past, // falaram
    eram: past, // comeram
    iram: past, // partiram
    'ámos': past, // falámos (european spelling)
    asse: subj, // falasse
    isse: subj, // partisse
    'arão': fut, // falarão
    'erão': fut,
    'irão': fut,
    arei: fut, // falarei
    erei: fut,
    irei: fut,
    'arás': fut, // falarás
  },
  {
    // five-letter suffixes
    mente: rb, // rapidamente
    mento: nn, // movimento
    'ência': nn, // paciência
    'ância': nn, // importância
    assem: subj, // falassem
    issem: subj, // partissem
    ariam: cond, // falariam
    eriam: cond,
    iriam: cond,
    'íamos': imp, // comíamos
  },
  {
    // six-letter suffixes
    'ríamos': cond, // falaríamos
    aremos: fut, // falaremos
    eremos: fut,
    iremos: fut,
    'ávamos': imp, // falávamos
    'íssimo': jj, // lindíssimo
    'íssima': jj,
  },
  {
    // seven-letter suffixes
    'ássemos': subj, // falássemos
    'êssemos': subj,
    'íssemos': subj,
  },
]
