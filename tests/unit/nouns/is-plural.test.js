import test from 'tape'
import nlp from '../../_lib.js'
const here = '[pt-is-plural] '

test('nouns isPlural:', function (t) {
  t.deepEqual(nlp('os gatos e o cão').nouns().isPlural().out('array'), ['gatos'], here + 'gatos')
  t.deepEqual(nlp('comprei livros novos').nouns().isPlural().out('array'), ['livros'], here + 'livros')
  t.equal(nlp('o gato dorme').nouns().isPlural().found, false, here + 'singular is skipped')
  t.equal(nlp('').nouns().isPlural().found, false, here + 'empty')
  t.deepEqual(nlp('os gatos e os cães').nouns().isPlural(1).out('array'), ['cães'], here + 'nth')
  t.end()
})
