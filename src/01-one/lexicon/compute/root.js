const verbForm = function (term) {
  let want = [
    'FirstPerson',
    'SecondPerson',
    'ThirdPerson',
    'FirstPersonPlural',
    'SecondPersonPlural',
    'ThirdPersonPlural',
  ]
  return want.find(tag => term.tags.has(tag))
}

const toRoot = function (term, methods) {
  const { verb, noun, adjective } = methods.two.transform
  let tags = term.tags
  let str = term.implicit || term.normal || term.text
  // reduce an adjective to its root
  if (tags.has('Adjective')) {
    // female plural
    if (tags.has('FemaleAdjective') && tags.has('PluralAdjective')) {
      return adjective.fromFemalePlural(str)
    }
    //male plural
    if (tags.has('PluralAdjective')) {
      return adjective.fromPlural(str)
    }
    if (tags.has('FemaleAdjective')) {
      return adjective.fromFemale(str)
    }
    return null
  }
  // reduce a noun to root
  if (tags.has('Noun')) {
    if (tags.has('Plural')) {
      return noun.fromPlural(str)
    }
    return null
  }
  // reduce a verb to root
  if (tags.has('Verb')) {
    let form = verbForm(term)
    if (tags.has('Conditional')) {
      return verb.fromConditional(str, form)
    }
    if (tags.has('FutureTense')) {
      return verb.fromFutureTense(str, form)
    }
    if (tags.has('Imperative') && tags.has('Negative')) {
      return verb.fromImperativeNeg(str, form)
    }
    if (tags.has('Imperative')) {
      return verb.fromImperative(str, form)
    }
    if (tags.has('Imperfect')) {
      return verb.fromImperfect(str, form)
    }
    if (tags.has('PastTense')) {
      return verb.fromPastTense(str, form)
    }
    if (tags.has('Pluperfect')) {
      return verb.fromPluperfect(str, form)
    }
    if (tags.has('PresentTense')) {
      return verb.fromPresentTense(str, form)
    }
    if (tags.has('Gerund')) {
      return verb.fromGerund(str, form)
    }
    if (tags.has('PastParticiple')) {
      return verb.fromPastParticiple(str, form)
    }
    if (tags.has('Infinitive')) {
      return verb.fromInfinitivo(str, form)
    }
    return str
  }
  return null
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