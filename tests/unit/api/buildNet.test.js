import test from 'tape'
import nlp from '../../_lib.js'
const here = '[pt-buildNet] '
nlp.verbose(false)

test('buildNet:', function (t) {
  const matches = [
    { match: '{gritar/Verb}' },
    { match: '{escrito/Adjective}' },
    { match: '{bonito/Adjective}' },
    { match: '{salada/Noun}' },
    { match: '{livro/Noun}' },
    { match: '{professor/Noun}' },
  ]
  const net = nlp.buildNet(matches)
  t.ok(net.hooks.gritar, here + 'gritar')
  t.ok(net.hooks.gritamos, here + 'gritamos')
  t.ok(net.hooks.gritávamos, here + 'gritávamos')
  t.ok(net.hooks.gritarei, here + 'gritarei')
  t.ok(net.hooks.gritando, here + 'gritando')
  t.ok(net.hooks.gritado, here + 'gritado')
  t.ok(net.hooks.salada, here + 'salada')
  t.ok(net.hooks.saladas, here + 'saladas')
  t.ok(net.hooks.livro, here + 'livro')
  t.ok(net.hooks.livros, here + 'livros')
  t.ok(net.hooks.professor, here + 'professor')
  t.ok(net.hooks.professores, here + 'professores')
  t.ok(net.hooks.escrito, here + 'escrito')
  t.ok(net.hooks.escritos, here + 'escritos')
  t.ok(net.hooks.bonito, here + 'bonito')
  t.ok(net.hooks.bonita, here + 'bonita')
  t.ok(net.hooks.bonitos, here + 'bonitos')
  t.ok(net.hooks.bonitas, here + 'bonitas')
  t.end()
})

test('sweep:', function (t) {
  const net = nlp.buildNet([
    { match: 'sorvete', tag: 'Food' },
    { match: 'a pizza', tag: 'Food' },
  ])
  const doc = nlp('Gosto de sorvete e da pizza. O gato dorme.')
  const res = doc.sweep(net)
  t.deepEqual(res.view.out('array'), ['sorvete', 'pizza.'], here + 'view has both matches')
  t.equal(res.found.length, 2, here + 'two results')
  t.equal(res.found[0].match, 'sorvete', here + 'first result')
  t.equal(doc.match('#Food+').length, 2, here + 'tags were applied')
  t.equal(doc.has('gato #Food'), false, here + 'nothing else tagged')
  // no matches
  const none = nlp('o gato dorme').sweep(net)
  t.equal(none.view.found, false, here + 'empty view')
  t.deepEqual(none.found, [], here + 'empty found')
  t.end()
})

test('sweep without tagging:', function (t) {
  const net = nlp.buildNet([{ match: 'sorvete', tag: 'Food' }])
  const doc = nlp('gosto de sorvete')
  const res = doc.sweep(net, { tagger: false })
  t.equal(res.view.text(), 'sorvete', here + 'tagger:false still matches')
  t.equal(doc.has('#Food'), false, here + 'tagger:false does not tag')
  doc.sweep(net)
  t.equal(doc.match('#Food').text(), 'sorvete', here + 'tags by default')
  t.end()
})

test('sweep with roots:', function (t) {
  const net = nlp.buildNet([{ match: '{gritar/Verb}' }, { match: '{salada/Noun}' }, { match: '{bonito/Adjective}' }])
  const arr = [
    ['ontem gritamos muito', 'gritamos'],
    ['nós gritávamos sempre', 'gritávamos'],
    ['duas saladas por favor', 'saladas'],
    ['uma salada por favor', 'salada'],
    ['as casas bonitas', 'bonitas'],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.equal(nlp(str).sweep(net).view.text(), want, here + str)
  })
  t.end()
})

test('buildTrie + lookup:', function (t) {
  const trie = nlp.buildTrie(['sorvete', 'gosto de', 'não presente'])
  const doc = nlp('Gosto de sorvete. Também de SORVETE de limão!')
  t.deepEqual(doc.lookup(trie).out('array'), ['Gosto de', 'sorvete.', 'SORVETE'], here + 'lookup')
  t.equal(nlp('o gato dorme').lookup(trie).found, false, here + 'lookup finds nothing')
  t.end()
})

test('parseMatch:', function (t) {
  const regs = nlp.parseMatch('#Noun+ (o|a)? gato')
  t.equal(regs.length, 3, here + 'three tokens')
  t.equal(regs[0].tag, 'Noun', here + 'tag')
  t.equal(regs[0].greedy, true, here + 'greedy')
  t.equal(regs[1].optional, true, here + 'optional')
  t.equal(regs[2].word, 'gato', here + 'word')
  // a parsed match can be re-used
  t.equal(nlp('vejo o gato').match(nlp.parseMatch('o gato')).text(), 'o gato', here + 'use parsed match')
  t.end()
})
