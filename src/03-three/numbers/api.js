import find from './find.js'
import parseNumber from './parse/index.js'
import format from './format/index.js'
import { symbols, fromWord, isWord, unitWords } from './format/symbols.js'
import { bigs } from './parse/_data.js'

// floating-point noise - 0.1 + 0.2 - but a whole number is already exact
const tidy = num => (Number.isInteger(num) ? num : Number(num.toPrecision(15)))

const hasDash = /[-−–]$/
// 'uma', 'duas', 'duzentas'
const femCardinal = /^(uma|duas)$|entas$/
// 'milhão', 'milhões', 'bilhão' ..
const isBig = str => bigs.has(str)
const isNoun = term => term.tags.has('Noun') && !term.tags.has('Pronoun')
// 'as duas casas' - these are only ever feminine
const femBefore = new Set(['as', 'umas', 'estas', 'essas', 'aquelas', 'minhas', 'tuas', 'suas', 'nossas'])

// the word after these ones, if nothing is in the way
const getNext = function (terms, end) {
  const next = terms[end]
  return next && next.text && !/\S/.test(terms[end - 1].post + next.pre) ? next : null
}

// parse a number, and remember how it was written - so that it can be written back the same way
const parse = function (val) {
  const obj = parseNumber(val)
  const terms = val.docs[0]
  const isOrdinal = t => t.tags.has('Ordinal') && t.tags.has('TextValue')
  // the gender of 'primeira', '1ª', '1a' or 'duzentas'
  obj.isFemale = /[ªa]$/.test(obj.ordinal || '') || terms.some(t => {
    return t.tags.has('Ordinal') ? isOrdinal(t) && /as?$/.test(t.normal) : femCardinal.test(t.normal)
  })
  // 'primeiros', 'primeiras'
  obj.isPlural = terms.some(t => isOrdinal(t) && /s$/.test(t.normal))
  // the tokenizer keeps the sign of '-5%' apart from the term, as punctuation
  obj.hasDash = !obj.isText && obj.num < 0 && hasDash.test(terms[0].pre)
  return obj
}

// return the nth elem of a doc
export const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc)

// turn a number, or a string like 'doze' or '12', into a number (or null)
const toNum = function (view, n) {
  if (typeof n === 'number') {
    return Number.isFinite(n) ? n : null
  }
  if (typeof n !== 'string' || !n.trim()) {
    return null
  }
  const str = n.trim()
  // plain digits, like '12' or '-2.5'
  if (/^[+-]?([0-9]+(\.[0-9]*)?|\.[0-9]+)$/.test(str)) {
    return Number(str)
  }
  // a written-out number, like 'doze' or 'um milhão'
  const m = view.fromText(str).compute(['index', 'postTagger']).numbers()
  if (m.length !== 1 || m.text('normal') !== m.all().text('normal')) {
    return null
  }
  const num = parseNumber(m.eq(0)).num
  return typeof num === 'number' && Number.isFinite(num) ? num : null
}

// tags that describe the form of a number - these are set again for each new number
const formTags = new Set(['Value', 'TextValue', 'NumericValue', 'Cardinal', 'Ordinal', 'Fraction', 'Determiner'])

// find the symbol or unit of a number, and the terms that it is written in.
// - it may be attached - '50%', '€5', '5km' - or be the next word - '5 €', 'cinquenta por cento'
// - or the word before - 'R$ 5'
const findUnit = function (val, obj, end) {
  const [n, start] = val.fullPointer[0]
  const terms = val.document[n]
  const last = terms[end - 1]
  const next = getNext(terms, end)
  // a sign is not a symbol - '+5%', '10+'
  const lead = /^\+/.test(obj.prefix) ? '+' : ''
  const trail = /\+$/.test(obj.suffix) ? '+' : ''
  const prefix = obj.prefix.slice(lead.length).toLowerCase()
  const suffix = obj.suffix.slice(0, obj.suffix.length - trail.length).toLowerCase()
  if (!obj.isText && (prefix || suffix)) {
    // '5km' is a contraction of two terms - '5km' and an empty 'km'
    const silent = terms[end]
    const isSplit = Boolean(silent && silent.text === '' && silent.implicit && last.implicit)
    const unit = { attached: true, isSplit, lead, trail, view: isSplit ? val.update([[n, start, end + 1]]) : val }
    // the symbol, in its original case - '5 Kg'
    unit.prefix = lead + obj.prefix.slice(lead.length)
    unit.suffix = obj.suffix
    if (prefix && suffix) {
      return unit
    }
    if (symbols.hasOwnProperty(prefix || suffix)) {
      unit.key = prefix || suffix
    } else if (suffix && isWord.test(suffix)) {
      unit.word = unit.suffix.slice(0, suffix.length)
      unit.tag = isSplit ? Array.from(silent.tags) : []
    }
    return unit
  }
  // 'R$ 5', '€ 5'
  const before = terms[start - 1]
  if (!obj.isText && before && symbols.hasOwnProperty(before.normal) && !/\S/.test(before.post + terms[start].pre)) {
    return { attached: false, key: before.normal, view: val.update([[n, start - 1, end]]) }
  }
  if (!next) {
    return null
  }
  const unit = { attached: false, view: val.update([[n, start, end + 1]]) }
  // '5 €'
  if (symbols.hasOwnProperty(next.normal)) {
    unit.key = next.normal
    return unit
  }
  // 'cinco por cento'
  const after = terms[end + 1]
  if (next.normal === 'por' && next.tags.has('Unit') && after && after.tags.has('Unit')) {
    unit.key = '%'
    unit.isWord = true
    unit.view = val.update([[n, start, end + 2]])
    return unit
  }
  // 'cinco euros'
  if (fromWord.hasOwnProperty(next.normal)) {
    unit.key = fromWord[next.normal]
    unit.isWord = true
    return unit
  }
  return null
}

// choose the new text for a number, and for its symbol or unit.
// a symbol is never left stuck to a word - '50%' is 'cinquenta por cento', and not 'cinquenta%'
// - returns null if this number can't be written like that
const getPlan = function (val, obj, fmt, toSymbol) {
  const [n, start, stop] = val.fullPointer[0]
  const terms = val.document[n]
  // 'um milhão de euros' - this 'de' belongs to the number
  const de = getNext(terms, stop)
  const hasDe = Boolean(de) && de.normal === 'de' && isBig(terms[stop - 1].normal) && Boolean(getNext(terms, stop + 1))
  const end = hasDe ? stop + 1 : stop
  const isCardinal = fmt === 'TextCardinal' || fmt === 'Cardinal'
  const unit = isCardinal ? findUnit(val, obj, end) : null
  // the word that this number counts - 'uma menina', 'duzentas casas'
  const next = getNext(terms, end)
  const noun = next && isNoun(next) ? next : null
  const how = Object.assign({}, obj, { prefix: '', suffix: '' })
  // the tagger knows the gender of some nouns - 'menina', 'professoras'
  const before = terms[start - 1]
  const hasFem = Boolean(before) && femBefore.has(before.machine || before.normal) && !/\S/.test(before.post + terms[start].pre)
  how.isFemale = obj.isFemale || Boolean(noun && (noun.tags.has('FemaleNoun') || hasFem))
  const plan = { view: val.update([[n, start, end]]), unitTerms: 0, unitTag: null, inPlace: false }
  // 'um milhão de casas'
  const withDe = str => (str && noun && isBig(str.split(' ').pop()) ? str + ' de' : str)
  if (!unit) {
    plan.str = format(fmt === 'Cardinal' ? obj : how, fmt)
    plan.numTerms = (plan.str || '').split(' ').length
    // '+5' is '+cinco'
    if (fmt === 'TextCardinal' && plan.str) {
      plan.str = (/^\+/.test(obj.prefix) ? '+' : '') + withDe(plan.str)
    }
    return plan
  }
  if (fmt === 'Cardinal') {
    plan.str = format(obj, fmt)
    if (unit.attached) {
      // '5km' -> '6km' - keep both halves of the contraction
      plan.inPlace = unit.isSplit
      plan.num = format(how, fmt)
      plan.str = (obj.num < 0 ? '-' : '') + unit.prefix + plan.num.replace(/^-/, '') + unit.suffix
    } else if (toSymbol && unit.isWord && unit.key === '%') {
      // 'cinquenta por cento' -> '50 %'
      plan.view = unit.view
      plan.str = plan.str + ' %'
      plan.unitTerms = 1
      plan.unitTag = 'Unit'
    }
    plan.numTerms = 1
    return plan
  }
  // written-out
  let words = null
  if (unit.key) {
    words = unitWords(unit.key, obj.num)
    plan.unitTag = symbols[unit.key][2]
    // 'um euro' and 'uma libra'
    how.isFemale = Boolean(symbols[unit.key][3])
  } else if (unit.word) {
    words = unit.word
    plan.unitTag = unit.tag
  }
  let num = format(how, fmt)
  // '#5' or '10+' have no words
  if (!words || !num) {
    return null
  }
  plan.numTerms = num.split(' ').length
  // 'um milhão de euros'
  if (unit.key !== '%' && isBig(num.split(' ').pop())) {
    num += ' de'
  }
  plan.view = unit.view
  plan.str = (unit.lead || '') + num + ' ' + words + (unit.trail || '')
  plan.unitTerms = words.split(' ').length
  return plan
}

// swap-in the new form of this number, and tag it as the tagger would have.
// - the terms made by .replaceWith() are tagged without their neighbours - so the 'um' of
// 'um gato' is a Determiner, and '.numbers()' can't find it again.
// returns the new number, without its unit
const replace = function (val, obj, fmt, toSymbol) {
  const plan = getPlan(val, obj, fmt, toSymbol)
  if (!plan || !plan.str) {
    return val
  }
  const first = val.docs[0][0]
  // the sign is written by the number, now
  if (obj.hasDash) {
    first.pre = first.pre.replace(hasDash, '')
  }
  // re-write the first half of '5km', beside its silent 'km'
  if (plan.inPlace) {
    first.text = plan.str
    first.normal = plan.str.toLowerCase()
    first.implicit = plan.num
    first.machine = plan.num
    return val
  }
  // remember any tags about the role of the number - #Money, #Percent, #Date
  const keep = Array.from(first.tags).filter(tag => !formTags.has(tag))
  let m = plan.view
  m.replaceWith(plan.str)
  const [n, start, end] = m.fullPointer[0]
  // split the number from its unit
  if (plan.unitTerms > 0) {
    const unit = m.update([[n, end - plan.unitTerms, end]])
    unit.unTag('Value')
    unit.tag(plan.unitTag)
  }
  m = m.update([[n, start, start + plan.numTerms]])
  const isText = fmt === 'TextCardinal' || fmt === 'TextOrdinal'
  const isOrdinal = fmt === 'Ordinal' || fmt === 'TextOrdinal'
  m.unTag('Determiner')
  m.tag(isText ? 'TextValue' : 'NumericValue')
  m.tag(isOrdinal ? 'Ordinal' : 'Cardinal')
  if (keep.length > 0) {
    m.tag(keep)
  }
  return m
}

// run a change on each number, and keep this view pointing at the new terms
// - .replaceWith() only repairs the one-match view that it is called on. Without this,
// the view that the user holds keeps the ids of the deleted terms, and core 'repairs'
// each of its matches by stretching it out to the end of the sentence.
// returns the same view, so that every link of a chain stays in sync
const mutate = function (view, fn) {
  const res = view.map(val => fn(val) || val)
  view.ptrs = res.fullPointer
  view.uncache()
  return view
}

const api = function (View) {
  /**   */
  class Numbers extends View {
    constructor(document, pointer, groups) {
      super(document, pointer, groups)
      this.viewType = 'Numbers'
    }
    parse(n) {
      return getNth(this, n).map(parseNumber, [])
    }
    get(n) {
      return getNth(this, n).map(parseNumber, []).map(o => o.num)
    }
    json(n) {
      // a number selects the nth match, anything else is json options
      const opts = typeof n === 'number' ? undefined : n
      const doc = getNth(this, n)
      return doc.map(p => {
        const json = p.toView().json(opts)[0]
        const parsed = parseNumber(p)
        json.number = {
          prefix: parsed.prefix,
          num: parsed.num,
          suffix: parsed.suffix,
          hasComma: parsed.hasComma,
        }
        return json
      }, [])
    }
    /** any known measurement unit, for the number */
    units() {
      return this.growRight('#Unit+').match('#Unit+$')
    }
    /** return only ordinal numbers */
    isOrdinal() {
      return this.if('#Ordinal')
    }
    /** return only cardinal numbers*/
    isCardinal() {
      return this.if('#Cardinal')
    }

    /** convert to numeric form like '8' or '8º' */
    toNumber() {
      return mutate(this, val => {
        // leave 'três quartos' alone
        if (!val.has('#TextValue') || val.has('#Fraction')) {
          return val
        }
        const obj = parse(val)
        if (obj.num === null) {
          return val
        }
        const fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal'
        // 'cinquenta por cento' becomes '50 %'
        return replace(val, obj, fmt, true)
      })
    }
    /** convert to text form like 'oito' or 'oitavo' */
    toText() {
      return mutate(this, val => {
        if (val.has('#TextValue')) {
          return val
        }
        const obj = parse(val)
        // there are no words for '3,5' or '1/2'
        if (!Number.isInteger(obj.num)) {
          return val
        }
        const fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal'
        return replace(val, obj, fmt)
      })
    }
    /** convert ordinal to cardinal form, like 'oito', or '8' */
    toCardinal() {
      return mutate(this, val => {
        if (!val.has('#Ordinal')) {
          return val
        }
        const obj = parse(val)
        if (obj.num === null) {
          return val
        }
        const fmt = val.has('#TextValue') ? 'TextCardinal' : 'Cardinal'
        return replace(val, obj, fmt)
      })
    }
    /** convert cardinal to ordinal form, like 'oitavo', or '8º' */
    toOrdinal() {
      return mutate(this, val => {
        if (val.has('#Ordinal')) {
          return val
        }
        const obj = parse(val)
        // there is no ordinal for '1,5', 'três quartos' or '-5'
        if (!Number.isInteger(obj.num) || obj.num < 1) {
          return val
        }
        // ... or for an amount - '50%', '5€', '5km', 'cinco euros'
        if (obj.prefix || obj.suffix || val.has('(#Percent|#Money)')) {
          return val
        }
        const fmt = val.has('#TextValue') ? 'TextOrdinal' : 'Ordinal'
        return replace(val, obj, fmt)
      })
    }

    /** return only numbers that are == n */
    isEqual(n) {
      return this.filter(val => parseNumber(val).num === n)
    }
    /** return only numbers that are > n*/
    greaterThan(n) {
      return this.filter(val => parseNumber(val).num > n)
    }
    /** return only numbers that are < n*/
    lessThan(n) {
      return this.filter(val => parseNumber(val).num < n)
    }
    /** return only numbers > min and < max */
    between(min, max) {
      return this.filter(val => {
        const num = parseNumber(val).num
        return num > min && num < max
      })
    }
    /** set these number to n */
    set(n) {
      if (n === undefined) {
        return this // don't bother
      }
      n = toNum(this, n)
      if (n === null) {
        return this // not a number
      }
      return mutate(this, val => {
        const obj = parse(val)
        obj.num = n
        let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal'
        if (val.has('#TextValue')) {
          fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal'
        }
        return replace(val, obj, fmt)
      })
    }
    add(n) {
      n = toNum(this, n)
      if (!n) {
        return this // don't bother
      }
      return mutate(this, val => {
        const obj = parse(val)
        if (obj.num === null) {
          return val
        }
        // avoid float noise - 0.1 + 0.2
        obj.num = tidy(obj.num + n)
        let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal'
        if (obj.isText) {
          fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal'
        }
        return replace(val, obj, fmt)
      })
    }
    /** decrease each number by n*/
    subtract(n) {
      n = toNum(this, n)
      if (!n) {
        return this // don't bother
      }
      return this.add(n * -1)
    }
    /** increase each number by 1 */
    increment() {
      return this.add(1)
    }
    /** decrease each number by 1 */
    decrement() {
      return this.add(-1)
    }
    // overloaded - keep Numbers class
    update(pointer) {
      const m = new Numbers(this.document, pointer)
      m._cache = this._cache // share this full thing
      return m
    }
  }
  // aliases
  Numbers.prototype.isBetween = Numbers.prototype.between
  Numbers.prototype.minus = Numbers.prototype.subtract
  Numbers.prototype.plus = Numbers.prototype.add
  Numbers.prototype.equals = Numbers.prototype.isEqual

  View.prototype.numbers = function (n) {
    let m = find(this)
    m = getNth(m, n)
    return new Numbers(this.document, m.pointer)
  }
  // alias
  View.prototype.values = View.prototype.numbers
}
export default api
