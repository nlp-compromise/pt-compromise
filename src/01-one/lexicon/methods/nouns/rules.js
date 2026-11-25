// rule-based noun inflection - portuguese plurals change the end of the word, and its written accent

// [singular, plural]
const pairs = [
  ['mal', 'males'],
  ['cônsul', 'cônsules'],
  ['caráter', 'caracteres'],
  ['júnior', 'juniores'],
  ['sênior', 'seniores'],
  ['cânon', 'cânones'],
  ['túnel', 'túneis'],
  ['qualquer', 'quaisquer'],
  ['mãe', 'mães'],
  ['pai', 'pais'],
  ['herói', 'heróis'],
  // an unstressed '-en' loses its accent
  ['hífen', 'hifens'],
  ['pólen', 'polens'],
  ['abdômen', 'abdomens'],
  ['líquen', 'liquens'],
  ['éden', 'edens'],
  ['gérmen', 'germens'],
  // a stressed '-s' loses it too
  ['gás', 'gases'],
  ['ás', 'ases'],
  ['ananás', 'ananases'],
  ['lilás', 'lilases'],
  ['revés', 'reveses'],
  ['convés', 'conveses'],
  ['viés', 'vieses'],
  ['retrós', 'retroses'],
  ['rês', 'reses'],
  ['obus', 'obuses'],
  ['país', 'países'],
  ['deus', 'deuses'],
  ['adeus', 'adeuses'],
  // loanwords
  ['gol', 'gols']
]
const irregular = { toPlural: {}, fromPlural: {} }
pairs.forEach((a) => {
  irregular.toPlural[a[0]] = a[1]
  irregular.fromPlural[a[1]] = a[0]
})
// both are right
irregular.fromPlural.carateres = 'caráter'

const set = (str) => new Set(str.split(','))
// '-ão' is '-ões', but not for these - 'pães', 'alemães'
const aes = set('pão,cão,alemão,capitão,escrivão,tabelião,capelão,catalão,charlatão,sacristão,guardião')
// .. or these - 'mãos', 'irmãos' - and any unstressed '-ão' - 'órgãos'
const aos = set('mão,irmão,cidadão,cristão,pagão,grão,chão,vão,são,artesão,cortesão,ancião,afegão,desvão')
// singular nouns that end in an unstressed '-s'
const same = set('lápis,tênis,oásis,íris,cútis,pélvis,práxis,cais,grátis,pires,alferes,ourives,herpes,simples,atlas,jeans')
// nouns that are only used in the plural
const pluralOnly = set('óculos,férias,parabéns,núpcias,pêsames,arredores,víveres,fezes,cócegas,anais,afazeres')
// stressed '-i' nouns, which look like the plural of an '-il' - 'rubis', but 'barris'
const plainI = set('rubi,javali,abacaxi,gibi,jabuti,saci,quati,caqui,bisturi,colibri,kiwi,esqui,tupi,guarani,siri,zumbi,sushi')
// '-e' nouns, which look like the plural of a consonant - 'árvores', but 'flores'
const plainE = set('árvore,hectare,folclore,software,hardware,gaze,doze,treze')

const strip = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', â: 'a', ê: 'e', ô: 'o' }
const hasAccent = /[áéíóúâêô]/
const noAccent = (str) => str.replace(/[áéíóúâêô]/g, (c) => strip[c])
// '-ês' is a singular - 'inglês', 'mês' - but 'bebês' is a plural
const isEs = /(guês|glês|ancês|cocês|[aoi]nês|landês|amês|[rn]tês|^mês|marquês)$/

// is this a noun, or an adjective, in the given lexicon?
const isWord = (str, lex) => Boolean(lex) && lex.hasOwnProperty(str) && /Noun|Adjective|Singular/.test(lex[str])
// the first of these words that we know - or the first one
const pick = (lex, arr) => arr.find((str) => isWord(str, lex)) || arr[0]

// 'lápis', 'vírus', 'tórax', 'mês' are not plurals
const isSingular = function (str) {
  if (!str.endsWith('s')) {
    return true
  }
  // 'ônibus', 'bíceps', 'português'
  return same.has(str) || irregular.toPlural.hasOwnProperty(str) || isEs.test(str) || (/([^aeiouáéíóúâêô]us|ps)$/.test(str) && hasAccent.test(str))
}

export { irregular, aes, aos, pluralOnly, plainI, plainE, noAccent, hasAccent, isEs, isWord, pick, isSingular }
