const clitics = { lo: true, la: true, los: true, las: true }

const verbPhrase = function (terms, i, world) {
  let setTag = world.methods.one.setTag
  // handle dropped-s in  'lavamo-nos' (lavamos + nos)
  if (terms[i + 1] && terms[i + 1].normal === 'nos') {
    let t = terms[i]
    if (/mo$/.test(t.normal)) {
      setTag([t], 'FirstPersonPlural', world, false, '2-dropped-s')
    }
  }
  // handle dropped-r in 'fazê-lo', 'amá-la' (fazer + o, amar + a)
  if (terms[i + 1] && clitics[terms[i + 1].normal] === true) {
    let t = terms[i]
    if (/[áêô]$/.test(t.normal)) {
      setTag([t], 'Infinitive', world, false, '2-dropped-r')
    }
  }
}
export default verbPhrase
