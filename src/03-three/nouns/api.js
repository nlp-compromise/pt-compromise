export const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc)

// get root form of adjective
const getRoot = function (m, methods) {
  let str = m.text('normal')
  let isPlural = m.has('#Plural')
  if (isPlural) {
    return methods.toSingular(str)
  }
  return str
}

const api = function (View) {
  class Nouns extends View {
    constructor(document, pointer, groups) {
      super(document, pointer, groups)
      this.viewType = 'Nouns'
    }
    conjugate(n) {
      const methods = this.methods.two.transform.noun
      return getNth(this, n).map(m => {
        let str = getRoot(m, methods)
        return {
          singular: str,
          plural: methods.toPlural(str),
        }
      }, [])
    }
    isPlural(n) {
      return getNth(this, n).if('#PluralNoun')
    }
    toPlural(n) {
      const methods = this.methods.two.transform.noun
      getNth(this, n).forEach(m => {
        let str = getRoot(m, methods)
        let plural = methods.toPlural(str)
        return m.replaceWith(plural)
      })
      return this
    }
    toSingular(n) {
      const methods = this.methods.two.transform.noun
      getNth(this, n).if('#Plural').forEach(m => {
        let str = getRoot(m, methods)
        let plural = methods.toSingular(str)
        return m.replaceWith(plural)
      })
      return this
    }
  }

  View.prototype.nouns = function (n) {
    let m = this.match('#Noun+')
    m = getNth(m, n)
    return new Nouns(this.document, m.pointer)
  }
}
export default api