import unicode from './unicode.js'
import contractions from './contractions.js'
import abbreviations from './abbreviations.js'


export default {
  mutate: (world) => {
    world.model.one.unicode = unicode

    world.model.one.contractions = contractions

    // our own abbreviations, for the sentence-parser
    world.model.one.abbreviations = { ...abbreviations }

    // 'que' -> 'quebec'
    delete world.model.one.lexicon.que
  }
}