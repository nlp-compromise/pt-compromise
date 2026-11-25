export const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc)

// words that agree with their noun - articles, their contractions ('do', 'na', 'pelo', 'num'), demonstratives and possessives
const isDet = /^(([dn]|pel|pr)?[oa]|ao|à|[dn]?uma?|[dn]?(est|ess)[ea]|[dnà]?aquel[ea]|meu|minha|teu|tua|seu|sua|[nv]oss[oa]|(outr|tod)[oa]|(alg|nenh)uma?)$/
// the article hidden inside of a contraction - 'do' is 'de' + 'o'
const inner = /^([oa]s?|uma?s?|uns)$/

// .. and the order that they come in, from the noun
const order = [/^(meu|minha|teu|tua|seu|sua|[nv]oss[oa]|outr[oa])s?$/, /^[^t]/, /^t/]

const plural = (str) => (str.endsWith('m') ? str.slice(0, -1) + 'ns' : str + 's')
const singular = (str) => (str.endsWith('ns') ? str.slice(0, -2) + 'm' : str.slice(0, -1))
// 'o' -> 'a', 'do' -> 'da', 'ao' -> 'à', 'um' -> 'uma', 'meu' -> 'minha', 'este' -> 'esta'
const female = function (str) {
  if (str === 'ao') {
    return 'à'
  }
  if (/[mst]eu$/.test(str)) {
    return str === 'meu' ? 'minha' : str.slice(0, -2) + 'ua'
  }
  return str.endsWith('m') ? str + 'a' : str.replace(/[oe]$/, 'a')
}
const swaps = {
  toPlural: (str) => (isDet.test(str) ? plural(str) : null),
  toSingular: (str) => (/s$/.test(str) && isDet.test(singular(str)) ? singular(str) : null),
  toFeminine: function (str) {
    const isPlural = /s$/.test(str) && isDet.test(singular(str))
    const one = isPlural ? singular(str) : str
    if (!isDet.test(one) || /(a|à|ua)$/.test(one)) {
      return null
    }
    return isPlural ? plural(female(one)) : female(one)
  }
}

// the word(s) before this noun follow it - 'o meu livro' -> 'os meus livros', 'do menino' -> 'da menina'
const swapArticle = function (m, kind) {
  const [n, start] = m.fullPointer[0]
  const terms = m.document[n]
  let last = 0
  for (let i = start - 1; i >= 0; i -= 1) {
    const term = terms[i]
    // the second half of a contraction has no text
    if (!term.text) {
      const str = swaps[kind](term.implicit || '')
      if (!inner.test(term.implicit) || !str) {
        return
      }
      term.implicit = str
      continue
    }
    // 'voltei a casa' is a preposition
    const str = term.tags.has('Preposition') && !term.implicit ? null : swaps[kind](term.normal)
    // 'todos' + 'os' + 'meus' + 'livros'
    const rank = order.findIndex((reg) => reg.test(term.normal))
    if (!str || rank < last || /[,;:.!?-]/.test(term.post)) {
      return
    }
    last = rank + 1
    const isTitle = /^\p{Lu}/u.test(term.text) && !/^\p{Lu}{2}/u.test(term.text)
    term.text = isTitle ? str[0].toUpperCase() + str.slice(1) : str
    term.normal = str
  }
}

const api = function (View) {
  class Nouns extends View {
    constructor(document, pointer, groups) {
      super(document, pointer, groups)
      this.viewType = 'Nouns'
    }
    conjugate(n) {
      const methods = this.methods.two.transform.noun
      const lexicon = this.model.one.lexicon
      return getNth(this, n).map(m => {
        const str = m.text('normal')
        const one = m.has('#Plural') ? methods.fromPlural(str, lexicon) : str
        const out = { singular: one, plural: m.has('#Plural') ? str : methods.toPlural(str) }
        // only people, and animals, have a feminine form
        const fem = methods.toFeminine(one)
        if (fem !== one || methods.isCommon(one) || m.has('#FemaleNoun')) {
          out.feminine = fem
        }
        return out
      }, [])
    }
    toFeminine(n) {
      const methods = this.methods.two.transform.noun
      const lexicon = this.model.one.lexicon
      getNth(this, n).forEach(m => {
        const str = m.text('normal')
        const isPlural = m.has('#Plural')
        const one = isPlural ? methods.fromPlural(str, lexicon) : str
        const fem = methods.toFeminine(one)
        if (fem === one && !methods.isCommon(one)) {
          return
        }
        // agree the determiner - 'o professor' → 'a professora'
        swapArticle(m, 'toFeminine')
        if (fem !== one) {
          m.replaceWith(isPlural ? methods.toPlural(fem) : fem)
          m.tag(isPlural ? 'Plural' : 'Singular', 'toFeminine')
        }
      })
      return this
    }
    isPlural(n) {
      return getNth(this, n).if('#Plural')
    }
    toPlural(n) {
      const methods = this.methods.two.transform.noun
      getNth(this, n).ifNo('(#Plural|#Pronoun)').forEach(m => {
        const str = m.text('normal')
        swapArticle(m, 'toPlural')
        m.replaceWith(methods.toPlural(str))
        m.tag('Plural', 'toPlural')
      })
      return this
    }
    toSingular(n) {
      const methods = this.methods.two.transform.noun
      const lexicon = this.model.one.lexicon
      getNth(this, n).if('#Plural').ifNo('#Pronoun').forEach(m => {
        const str = methods.fromPlural(m.text('normal'), lexicon)
        // 'os óculos' has no singular
        if (str === m.text('normal') && !methods.isSingular(str)) {
          return
        }
        swapArticle(m, 'toSingular')
        m.replaceWith(str)
        m.tag('Singular', 'toSingular')
      })
      return this
    }
  }

  View.prototype.nouns = function (n) {
    let m = this.match('#Noun')
    m = getNth(m, n)
    return new Nouns(this.document, m.pointer)
  }
}
export default api
