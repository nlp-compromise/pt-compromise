import lexicon, { verbForms, adjForms } from './lexicon.js'
import methods from './methods/index.js'
import root from './compute/root.js'

export default {
  words: lexicon,
  model: { two: { verbForms, adjForms } },
  compute: { root: root },
  methods: {
    two: {
      transform: methods
    }
  },
}