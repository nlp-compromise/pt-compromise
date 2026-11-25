import api from './api.js'

export default {
  api,
  // the shared european-numbers plugin reads '1.234,56' - these are our ordinals: '2ª', '3.º'
  model: { two: { europeanNumbers: { ordinal: '\\.?[ºª°]' } } },
}
