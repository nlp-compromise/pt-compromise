import api from './api.js'

export default {
  api,
  // the shared european-numbers plugin reads '1.234,56' - these are our ordinals: '2ª', '3.º'
  model: {
    two: {
      europeanNumbers: {
        ordinal: '\\.?[ºª°]',
        // the words beside a number - '50 %', '5,30 €'
        percent: ['por cento'],
        currencies: ['euro', 'euros', 'real', 'reais', 'dólar', 'dólares', 'dolar', 'dolares', 'libra', 'libras'],
      },
    },
  },
}
