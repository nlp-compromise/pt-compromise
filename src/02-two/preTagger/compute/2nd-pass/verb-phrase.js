const clitics = { lo: true, la: true, los: true, las: true }
// clitics that can appear mid-word in mesoclisis - 'dar-te-ei'
const midClitics = {
  me: true, te: true, se: true, lhe: true, lhes: true,
  nos: true, vos: true, lo: true, la: true, los: true, las: true, o: true, a: true,
}
const futureEnds = /^(ei|ás|á|emos|eis|ão)$/
const conditionalEnds = /^(ia|ias|íamos|íeis|iam)$/
// allomorphs of o/a/os/as after a nasal sound - 'dão-no'
const nasalClitics = { no: true, na: true, nos: true, nas: true }

const verbPhrase = function (terms, i, world) {
  let setTag = world.methods.one.setTag
  let t = terms[i]
  // handle dropped-s in  'lavamo-nos' (lavamos + nos)
  if (terms[i + 1] && terms[i + 1].normal === 'nos') {
    if (/mo$/.test(t.normal)) {
      setTag([t], 'FirstPersonPlural', world, false, '2-dropped-s')
    }
  }
  // handle dropped-r in 'fazê-lo', 'amá-la' (fazer + o, amar + a)
  if (terms[i + 1] && clitics[terms[i + 1].normal] === true) {
    if (/[áêô]$/.test(t.normal)) {
      setTag([t], 'Infinitive', world, false, '2-dropped-r')
    }
  }
  // handle mesoclisis - 'dar-te-ei', 'dir-se-ia'
  if (terms[i + 2] && t.post === '-' && /r$/.test(t.normal) &&
    terms[i + 1].post === '-' && midClitics[terms[i + 1].normal] === true) {
    let end = terms[i + 2].normal
    let tense = null
    if (futureEnds.test(end)) {
      tense = 'FutureTense'
    } else if (conditionalEnds.test(end)) {
      tense = 'Conditional'
    }
    if (tense !== null) {
      setTag([t, terms[i + 2]], tense, world, false, '2-mesoclisis')
      setTag([terms[i + 1]], 'Reflexive', world, false, '2-mesoclisis')
    }
  }
  // handle clitic allomorphs after a nasal verb - 'dão-no' is dão + o, not 'em o'
  if (terms[i + 1] && t.post === '-' && /(ão|õe|m)$/.test(t.normal) && t.tags.has('Verb')) {
    let nxt = terms[i + 1]
    let txt = (nxt.text || '').toLowerCase()
    if (nasalClitics[txt] === true && nxt.implicit === 'em') {
      // undo the em+o contraction-split
      nxt.implicit = undefined
      nxt.normal = txt
      setTag([nxt], 'Reflexive', world, false, '2-nasal-clitic')
      // its ghost-term, from the split
      if (terms[i + 2] && terms[i + 2].text === '' && terms[i + 2].implicit) {
        terms[i + 2].implicit = undefined
        terms[i + 2].normal = ''
        setTag([terms[i + 2]], 'Reflexive', world, false, '2-nasal-clitic')
      }
    }
  }
}
export default verbPhrase
