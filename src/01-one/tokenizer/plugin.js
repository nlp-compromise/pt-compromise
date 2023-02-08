import unicode from './unicode.js'
import contractions from './contractions.js'
import abbreviations from './abbreviations.js'


export default {
  mutate: (world) => {
    world.model.one.unicode = unicode

    world.model.one.contractions = contractions

    // pt abbreviations for sentence parser
    Object.assign(world.model.one.abbreviations, abbreviations)

    // 'que' -> 'quebec'
    delete world.model.one.lexicon.que
  }
}