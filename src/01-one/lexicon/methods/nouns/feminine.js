// only people and animals have a feminine form - 'menino' -> 'menina', but not 'livro'
// [masculine, feminine]
const pairs =
  'ator:atriz,actor:actriz,imperador:imperatriz,embaixador:embaixatriz,rei:rainha,réu:ré,herói:heroína,poeta:poetisa,profeta:profetisa,' +
  'sacerdote:sacerdotisa,conde:condessa,visconde:viscondessa,abade:abadessa,duque:duquesa,príncipe:princesa,barão:baronesa,' +
  'tigre:tigresa,leão:leoa,patrão:patroa,leitão:leitoa,pavão:pavoa,ladrão:ladra,sultão:sultana,cão:cadela,judeu:judia,' +
  'avô:avó,bisavô:bisavó,pai:mãe,homem:mulher,padrinho:madrinha,padrasto:madrasta,padre:madre,compadre:comadre,genro:nora,' +
  'cavalo:égua,galo:galinha,boi:vaca,bode:cabra,carneiro:ovelha,juiz:juíza,deus:deusa,frade:freira,monge:monja,mestre:mestra,' +
  'espanhol:espanhola,elefante:elefanta,garçom:garçonete,czar:czarina,maestro:maestrina,peru:perua,macho:fêmea'
const irregular = { toFeminine: {}, fromFeminine: {} }
pairs.split(',').forEach((str) => {
  const [m, f] = str.split(':')
  irregular.toFeminine[m] = f
  irregular.fromFeminine[f] = m
})

// people and animals in '-o', and '-ão' - 'gato' -> 'gata', 'irmão' -> 'irmã'
const animate = new Set(
  (
    'menin,garot,moç,filh,net,bisnet,sobrinh,prim,ti,sogr,cunhad,espos,noiv,namorad,amig,inimig,vizinh,alun,médic,advogad,' +
    'engenheir,enfermeir,cozinheir,secretári,funcionári,empregad,operári,empresári,bibliotecári,veterinári,voluntári,usuári,' +
    'proprietári,padeir,pedreir,carteir,bombeir,marinheir,costureir,jardineir,cabeleireir,faxineir,prefeit,ministr,deputad,' +
    'candidat,sóci,don,técnic,músic,físic,químic,matemátic,polític,mecânic,arquitet,fotógraf,filósof,gat,cachorr,pat,lob,urs,' +
    'macac,coelh,burr,porc,rat,pomb,gans,velh,brux,mag,sant,criad,escrav,viúv,solteir,companheir,parceir,guerreir,herdeir,' +
    'prisioneir,passageir,estrangeir,brasileir,mexican,american,italian,african,angolan,russ,greg,turc,suíç,argentin,cuban,' +
    'indian,índi,cigan,convidad,conhecid,desconhecid,delegad,aposentad,mendig,gême,irmã,campeã,cidadã,anã,alemã,capitã,órfã,' +
    'cristã,pagã,anciã,aldeã,espiã,guardiã,artesã,cirurgiã,escrivã,anfitriã,vilã,catalã'
  ).split(',')
)
// nouns with one form for both genders - 'o estudante', 'a estudante'
const common =
  /^(estudante|cliente|gerente|agente|assistente|paciente|doente|amante|visitante|habitante|participante|presidente|comerciante|viajante|imigrante|representante|adolescente|jovem|colega|atleta|chefe|intérprete|mártir|policial|fã|camarada|.*iatra|.{3,}[ií]sta)$/
const isCommon = (str) => common.test(str) && !/(re|tre|con)vista$/.test(str)

// '-or' nouns that are not a person - 'motor', 'computador'
const notPerson = /^((ar|pu|o|fe|pen|ver|con|esplen)?dor|(mo|se|fac?|tra|ve|ro|rea|cober|proje|extin|interrup)tor|.*(comput|ventil|elev|refriger|liquidific|aspir|radi|aceler|carreg|sec|process|naveg)ador|televisor|sensor|cursor)$/

// '-ão' that is '-ona' - 'solteirão', 'chorão'
const big = /(solteir|comil|alh|chor|sabich|valent|resmung|bonit|grand|bob)ão$/
// '-eu' that is '-eia' - 'europeu', 'ateu'
const eu = /(rop|^at|br|eb|gm|il)eu$/

// irregulars -> people that we know -> endings that are always a person
const toFeminine = function (str) {
  if (irregular.toFeminine.hasOwnProperty(str)) {
    return irregular.toFeminine[str]
  }
  // 'menino' -> 'menina', 'irmão' -> 'irmã', 'psicólogo' -> 'psicóloga'
  if (animate.has(str.slice(0, -1)) || /[^r]ólogo$/.test(str)) {
    return str.endsWith('ão') ? str.slice(0, -1) : str.slice(0, -1) + 'a'
  }
  // 'professor' -> 'professora', 'senhor' -> 'senhora'
  if (/([dts]or|^senhor)$/.test(str) && !notPerson.test(str)) {
    return str + 'a'
  }
  // 'freguês' -> 'freguesa'
  if (/.{2}ês$/.test(str)) {
    return str.slice(0, -2) + 'esa'
  }
  // 'solteirão' -> 'solteirona'
  if (big.test(str)) {
    return str.slice(0, -2) + 'ona'
  }
  // 'europeu' -> 'europeia'
  return eu.test(str) ? str.slice(0, -1) + 'ia' : str
}

const fromFeminine = function (str) {
  if (irregular.fromFeminine.hasOwnProperty(str)) {
    return irregular.fromFeminine[str]
  }
  // 'professora' -> 'professor'
  if (/([dts]or|^senhor)a$/.test(str)) {
    return str.slice(0, -1)
  }
  // 'freguesa' -> 'freguês'
  if (/.{2}esa$/.test(str) && toFeminine(str.slice(0, -3) + 'ês') === str) {
    return str.slice(0, -3) + 'ês'
  }
  // 'irmã' -> 'irmão', 'solteirona' -> 'solteirão', 'europeia' -> 'europeu'
  if (/ã$/.test(str) || big.test(str.slice(0, -3) + 'ão')) {
    return str.replace(/(ã|ona)$/, 'ão')
  }
  if (eu.test(str.slice(0, -2) + 'u')) {
    return str.slice(0, -2) + 'u'
  }
  // 'menina' -> 'menino'
  return isCommon(str) ? str : str.replace(/a$/, 'o')
}

export { toFeminine, fromFeminine, isCommon, big, eu }
