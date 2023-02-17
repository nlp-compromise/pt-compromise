const verbPhrase = function (terms, i, world) {
  let setTag = world.methods.one.setTag
  // handle dropped-s in  'lavamo-nos' (lavamos + nos)
  if (terms[i + 1] && terms[i + 1].normal === 'nos') {
    let t = terms[i]
    if (/mo$/.test(t.normal)) {
      setTag([t], 'FirstPersonPlural', world, false, '2-dropped-s')
    }
  }
}
export default verbPhrase