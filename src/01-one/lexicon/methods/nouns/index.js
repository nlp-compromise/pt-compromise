import { irregular, aes, aos, pluralOnly, plainI, plainE, noAccent, hasAccent, isEs, pick, isSingular } from './rules.js'

// irregulars -> invariables -> spelling rules -> '-s'
const toPlural = (str) => {
  if (irregular.toPlural.hasOwnProperty(str)) {
    return irregular.toPlural[str]
  }
  const stem = str.slice(0, -1)
  const two = str.slice(0, -2)
  // 'pão' -> 'pães', 'mão' -> 'mãos', 'órgão' -> 'órgãos', 'lição' -> 'lições'
  if (str.endsWith('ão')) {
    if (aes.has(str)) {
      return two + 'ães'
    }
    return aos.has(str) || hasAccent.test(two) ? str + 's' : two + 'ões'
  }
  // 'homem' -> 'homens'
  if (str.endsWith('m')) {
    return stem + 'ns'
  }
  // 'raiz' -> 'raízes', 'flor' -> 'flores', 'luz' -> 'luzes'
  if (/[rz]$/.test(str)) {
    return str.replace(/([aeou])iz$/, '$1íz') + 'es'
  }
  // 'animal' -> 'animais' - but 'troll' -> 'trolls'
  if (/[^l]l$/.test(str)) {
    // 'fóssil' -> 'fósseis', 'barril' -> 'barris'
    if (str.endsWith('il')) {
      return hasAccent.test(str) ? two + 'eis' : stem + 's'
    }
    // 'papel' -> 'papéis', 'lençol' -> 'lençóis' - but 'túnel' -> 'túneis', 'álcool' -> 'álcoois'
    if (/[eo]l$/.test(str) && !hasAccent.test(str)) {
      return two + (str.endsWith('el') ? 'éis' : 'óis')
    }
    // 'animal' -> 'animais', 'azul' -> 'azuis'
    return stem + 'is'
  }
  if (str.endsWith('s')) {
    // 'lápis', 'ônibus' never change - but 'mês' -> 'meses', 'inglês' -> 'ingleses'
    return isEs.test(str) ? str.slice(0, -2) + 'eses' : str
  }
  // 'hífen' -> 'hifens'
  if (/en$/.test(str) && hasAccent.test(str)) {
    return noAccent(str) + 's'
  }
  // 'tórax' - and 'casa' -> 'casas', 'café' -> 'cafés', 'shopping' -> 'shoppings'
  return str.endsWith('x') ? str : str + 's'
}

// irregulars -> invariables -> spelling rules -> known words -> the most likely one
// 'lex' is an optional lexicon, to look for the singular in
const fromPlural = (str, lex) => {
  if (irregular.fromPlural.hasOwnProperty(str)) {
    return irregular.fromPlural[str]
  }
  if (isSingular(str) || pluralOnly.has(str)) {
    return str
  }
  const e = str.slice(0, -1)
  const stem = str.slice(0, -2)
  const three = str.slice(0, -3)
  // 'lições' -> 'lição', 'pães' -> 'pão'
  if (/(õe|ãe)s$/.test(str)) {
    return three + 'ão'
  }
  // 'homens' -> 'homem' - but 'elétrons' -> 'elétron', 'slogans' -> 'slogan'
  if (str.endsWith('ns')) {
    return /ans$/.test(str) || (/ons$/.test(str) && hasAccent.test(stem)) ? e : pick(lex, [stem + 'm', e])
  }
  if (str.endsWith('is')) {
    // 'papéis' -> 'papel', 'lençóis' -> 'lençol'
    if (/[éó]is$/.test(str)) {
      return pick(lex, [three + noAccent(str.slice(-3, -2)) + 'l', e])
    }
    if (/[aeou]is$/.test(str)) {
      // 'reis' -> 'rei', 'bois' -> 'boi' - but 'animais' -> 'animal', 'azuis' -> 'azul'
      if (!hasAccent.test(str)) {
        return /[au]is$/.test(str) ? pick(lex, [stem + 'l', e]) : e
      }
      // 'álcoois' -> 'álcool', 'amáveis' -> 'amável', 'fósseis' -> 'fóssil'
      if (!str.endsWith('eis')) {
        return stem + 'l'
      }
      return str.endsWith('veis') ? pick(lex, [stem + 'l', three + 'il']) : pick(lex, [three + 'il', stem + 'l'])
    }
    // 'táxis' -> 'táxi', 'rubis' -> 'rubi' - but 'barris' -> 'barril'
    return hasAccent.test(str) || plainI.has(e) ? e : pick(lex, [e + 'l', e])
  }
  if (!str.endsWith('es') || /(ss|[^aeiouáéíóúâêô][rz])es$/.test(str) || plainE.has(e)) {
    // 'casas' -> 'casa', 'classes' -> 'classe', 'padres' -> 'padre', 'árvores' -> 'árvore'
    return e
  }
  // 'flores' -> 'flor', 'raízes' -> 'raiz', 'luzes' -> 'luz' - and 'hífenes' -> 'hífen'
  if (/[rz]es$/.test(str) || (/[eo]nes$/.test(str) && hasAccent.test(str))) {
    return pick(lex, [stem.replace(/íz$/, 'iz'), e])
  }
  // 'portugueses' -> 'português', 'meses' -> 'mês' - but 'teses' -> 'tese'
  const es = str.slice(0, -4) + 'ês'
  return str.endsWith('eses') && isEs.test(es) ? pick(lex, [es, e]) : e
}

const all = function (str) {
  const plur = toPlural(str)
  if (str === plur) {
    return [str]
  }
  return [str, plur]
}

export { toPlural, fromPlural, all }
