const toRoot = function (term, methods) {
  const { verb, noun, adjective } = methods.two.transform
  let tags = term.tags
  let str = term.implicit || term.normal || term.text
  // reduce a verb to root
  if (tags.has('Verb')) {
    if (tags.has('#Conditional')) {
      return verb.fromConditional(str)
    } else if (tags.has('#FutureTense')) {
      return verb.fromFutureTense(str)
    } else if (tags.has('#Imperative') && tags.has('#Negative')) {
      return verb.fromImperativeNeg(str)
    } else if (tags.has('#Imperative')) {
      return verb.fromImperative(str)
    } else if (tags.has('#Imperfect')) {
      return verb.fromImperfect(str)
    } else if (tags.has('#PastTense')) {
      return verb.fromPastTense(str)
    } else if (tags.has('#Pluperfect')) {
      return verb.fromPluperfect(str)
    } else if (tags.has('#PresentTense')) {
      return verb.fromPresentTense(str)
    } else if (tags.has('#Gerund')) {
      return verb.fromGerund(str)
    } else if (tags.has('#PastParticiple')) {
      return verb.fromPastParticiple(str)
    } else if (tags.has('#Infinitive')) {
      return verb.fromInfinitivo(str)
      // return verb.to
    }
    return str
  }
}

const root = function (view) {
  view.docs.forEach(terms => {
    terms.forEach(term => {
      let str = toRoot(term, view.world.methods)
      if (str && str !== term.normal) {
        term.root = str
      }
    })
  })

}
export default root