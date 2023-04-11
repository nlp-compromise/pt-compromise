const root = function (view) {
  const { verb, noun, adjective } = view.world.methods.two.transform
  view.docs.forEach(terms => {
    terms.forEach(term => {
      let str = term.implicit || term.normal || term.text

    })
  })

}
export default root