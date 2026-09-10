export const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc)

// get root form of verb
const getRoot = function (m) {
  m.compute('root')
  m = m.not('(#Auxiliary|#Adverb|#Negative|#Reflexive)')
  let str = m.text('root')
  return str
}

// which person is this verb-phrase in?
const personMap = {
  eu: 'first',
  tu: 'second',
  ele: 'third', ela: 'third', 'você': 'third',
  'nós': 'firstPlural',
  'vós': 'secondPlural',
  'vocês': 'thirdPlural', eles: 'thirdPlural', elas: 'thirdPlural',
}
const getPerson = function (m) {
  if (m.has('#FirstPersonPlural')) {
    return 'firstPlural'
  }
  if (m.has('#SecondPersonPlural')) {
    return 'secondPlural'
  }
  if (m.has('#ThirdPersonPlural')) {
    return 'thirdPlural'
  }
  if (m.has('#FirstPerson')) {
    return 'first'
  }
  if (m.has('#SecondPerson')) {
    return 'second'
  }
  if (m.has('#ThirdPerson')) {
    return 'third'
  }
  // look at the subject-pronoun, before the verb
  let subj = m.lookBehind('(eu|tu|ele|ela|você|nós|vós|vocês|eles|elas)$')
  if (subj.found) {
    return personMap[subj.last().text('normal')] || 'third'
  }
  return 'third'
}

// re-conjugate each verb-phrase, in-place
const convertTo = function (view, method) {
  const methods = view.methods.two.transform.verb
  view.forEach(m => {
    let str = getRoot(m)
    if (!str) {
      return
    }
    let person = getPerson(m)
    let obj = methods[method](str)
    let form = obj[person] || obj.third
    if (form) {
      m.replaceWith(form)
    }
  })
  return view
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
        toPastParticiple,
        toInfinitivo,
        toSubjPresent,
        toSubjImperfect,
        toSubjFuture } = methods
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
          Infinitivo: toInfinitivo(str),
          SubjunctivePresent: toSubjPresent(str),
          SubjunctiveImperfect: toSubjImperfect(str),
          SubjunctiveFuture: toSubjFuture(str),
          Gerund: toGerund(str),
          PastParticiple: toPastParticiple(str),
        }
      }, [])
    }
    toPastTense(n) {
      return convertTo(getNth(this, n), 'toPastTense')
    }
    toPresentTense(n) {
      return convertTo(getNth(this, n), 'toPresentTense')
    }
    toFutureTense(n) {
      return convertTo(getNth(this, n), 'toFutureTense')
    }
    toImperfect(n) {
      return convertTo(getNth(this, n), 'toImperfect')
    }
    toConditional(n) {
      return convertTo(getNth(this, n), 'toConditional')
    }
    toGerund(n) {
      const methods = this.methods.two.transform.verb
      getNth(this, n).forEach(m => {
        let str = getRoot(m)
        if (!str) {
          return
        }
        let gerund = methods.toGerund(str)
        if (gerund) {
          m.replaceWith(gerund)
        }
      })
      return this
    }
    toInfinitive(n) {
      getNth(this, n).forEach(m => {
        let str = getRoot(m)
        if (str) {
          m.replaceWith(str)
        }
      })
      return this
    }
  }

  View.prototype.verbs = function (n) {
    let m = this.match('#Verb+')
    m = getNth(m, n)
    return new Verbs(this.document, m.pointer)
  }
}
export default api
