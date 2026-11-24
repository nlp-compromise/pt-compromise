import test from 'tape'
import nlp from '../_lib.js'
const here = '[pt-buildNet-hmm] '

test('buildNet noun plurals:', function (t) {
  const net = nlp.buildNet([{ match: '{areia/Noun}' }])
  t.ok(net.hooks.areia, here + 'areia')
  t.ok(net.hooks.areias, here + 'areias')
  t.equal(nlp('as areias brancas').sweep(net).view.text(), 'areias', here + 'sweep areias')
  t.end()
})
