export const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc)

// get root form of verb
const getRoot = function (m) {
  m.compute('root')
  m = m.not('(#Auxiliary|#Adverb|#Negative|#Reflexive)')
  let str = m.text('root')
  return str
}

const api = function (View) {
  class Verbs extends View {
    constructor(document, pointer, groups) {
      super(document, pointer, groups)
      this.viewType = 'Verbs'
    }
    conjugate(n) {
      const methods = this.methods.two.transform.verb
      const { toConditional,
        toFutureTense,
        toImperativeNeg,
        toImperative,
        toImperfect,
        toPastTense,
        toPluperfect,
        toPresentTense,
        toGerund,
        toPastParticiple } = methods
      return getNth(this, n).map(m => {
        let str = getRoot(m, methods)
        return {

          Conditional: toConditional(str),
          FutureTense: toFutureTense(str),
          ImperativeNeg: toImperativeNeg(str),
          Imperative: toImperative(str),
          Imperfect: toImperfect(str),
          PastTense: toPastTense(str),
          Pluperfect: toPluperfect(str),
          PresentTense: toPresentTense(str),
          Gerund: toGerund(str),
          PastParticiple: toPastParticiple(str),

        }
      }, [])
    }
  }

  View.prototype.verbs = function (n) {
    let m = this.match('#Verb+')
    m = getNth(m, n)
    return new Verbs(this.document, m.pointer)
  }
}
export default api