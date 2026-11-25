import api from './api.js'
import { words } from './parse/_data.js'

export default {
  api,
  // 'duzentas', 'dezasseis', 'primeira', 'trilhões'
  words,
  model: {
    // '1o' and '1a' are ordinals, and not a number and its unit
    one: { numberSuffixes: { o: true, a: true } },
    two: {
      // the shared european-numbers plugin reads '1.234,56' - these are our ordinals: '2ª', '3.º', '1o'
      europeanNumbers: {
        ordinal: '\\.?[ºª°]|[oa]',
        // the words beside a number - '50 por cento', '5,30 euros'
        percent: ['por cento'],
        currencies: ['euro', 'euros', 'real', 'reais', 'dólar', 'dólares', 'dolar', 'dolares', 'libra', 'libras'],
      },
    },
  },
}
