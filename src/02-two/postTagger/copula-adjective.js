// the lexicon gives 'cara', 'interior' to a noun, 'bonita' to a name, and 'estreita' to a verb
// but after 'ser' or 'estar', a form of an adjective that we know is that adjective - 'é cara', 'são bonitas'
const copulaAdjective = function (view) {
  const world = view.world
  const setTag = world.methods.one.setTag
  const forms = world.model.two.adjForms
  view.docs.forEach((terms) => {
    for (let i = 1; i < terms.length; i += 1) {
      const term = terms[i]
      let n = i - 1
      // 'é muito cara'
      while (n > 0 && terms[n].tags.has('Adverb')) {
        n -= 1
      }
      if (terms[n].tags.has('Copula') && forms.hasOwnProperty(term.normal) && !term.tags.has('Adjective') && !/\p{Lu}/u.test(term.text)) {
        term.tags.clear()
        setTag([term], forms[term.normal], world, false, 'copula-adjective')
      }
    }
  })
}
export default copulaAdjective
