import test from 'tape'
import nlp from '../../_lib.js'
const here = '[pt-constructor] '
const txt = 'A irmã pequena comprou três maçãs. Onde estão as lições?'

test('constructor methods:', function (t) {
  t.ok(/^[0-9]+\.[0-9]+\.[0-9]+/.test(nlp.version), here + 'version is semver')
  t.equal(typeof nlp.world(), 'object', here + 'world')
  t.equal(typeof nlp.model().one.lexicon, 'object', here + 'model')
  t.equal(typeof nlp.methods().one.tokenize, 'object', here + 'methods')
  t.ok(nlp.hooks().includes('postTagger'), here + 'hooks')
  t.ok(nlp.hooks().includes('europeanNumbers'), here + 'shared number hook')
  t.equal(nlp.verbose(false), nlp, here + 'verbose is chainable')
  t.equal(typeof nlp.extend, 'function', here + 'extend')
  t.equal(typeof nlp.plugin, 'function', here + 'plugin')
  t.end()
})

test('tokenize:', function (t) {
  const doc = nlp.tokenize(txt)
  t.equal(doc.length, 2, here + 'tokenize splits sentences')
  t.equal(doc.text(), txt, here + 'tokenize keeps the text')
  t.equal(doc.wordCount(), 10, here + 'tokenize splits words')
  t.equal(doc.has('#Noun'), false, here + 'tokenize does not tag')
  t.equal(doc.match('maçãs').found, true, here + 'tokenize can match words')
  t.equal(doc.match('^onde').found, true, here + 'tokenize finds the sentence start')
  t.equal(doc.compute('preTagger').has('#Noun'), true, here + 'the tagger can run later')
  t.end()
})

test('parseMatch:', function (t) {
  const regs = nlp.parseMatch('#Noun+ (o|a)? [irmã]')
  t.equal(regs.length, 3, here + 'three tokens')
  t.equal(regs[0].tag, 'Noun', here + 'tag')
  t.equal(regs[0].greedy, true, here + 'greedy')
  t.equal(regs[1].optional, true, here + 'optional')
  t.equal(regs[2].word, 'irmã', here + 'word, with its ã')
  // a parsed match can be re-used
  t.equal(nlp('vejo a irmã').match(nlp.parseMatch('a irmã')).text(), 'a irmã', here + 'use parsed match')
  t.equal(nlp('o sabiá dorme').match(nlp.parseMatch('o . dorme')).text(), 'o sabiá dorme', here + 'wildcard')
  t.end()
})

test('plugins:', function (t) {
  nlp.plugin({
    api: function (View) {
      View.prototype.criaturas = function () {
        return this.match('#Criatura+')
      }
    },
    tags: { Criatura: { is: 'Noun' } },
    words: { curupira: 'Criatura' },
    compute: {
      tamanho: function (view) {
        view.docs.forEach(terms => {
          terms.forEach(term => {
            term.len = term.normal.length
          })
        })
      },
    },
  })
  const doc = nlp('o curupira dorme')
  t.equal(doc.criaturas().text(), 'curupira', here + 'plugin api + words')
  t.equal(doc.match('curupira').has('#Noun'), true, here + 'plugin tag is a Noun')
  t.equal(doc.compute('tamanho').docs[0][1].len, 8, here + 'plugin compute')
  nlp.addWords({ boitatá: 'Criatura', 'mula sem cabeça': 'Criatura' })
  t.equal(nlp('o boitatá canta').criaturas().text(), 'boitatá', here + 'addWords')
  t.equal(nlp('vem a mula sem cabeça').criaturas().text(), 'mula sem cabeça', here + 'addWords multi-word')
  nlp.addTags({ Duende: { is: 'Criatura' } })
  nlp.addWords({ saci: 'Duende' })
  t.equal(nlp('o saci vem').criaturas().text(), 'saci', here + 'addTags')
  t.equal(nlp('o saci vem').match('saci').has('#Noun'), true, here + 'addTags inherits')
  t.equal(nlp('o caipora vem', { caipora: 'Criatura' }).criaturas().text(), 'caipora', here + 'lexicon as 2nd param')
  // adding words does not lose the numbers
  t.deepEqual(nlp('zero sacis e três cães').numbers().get(), [0, 3], here + 'numbers after addWords')
  t.deepEqual(nlp('trinta e um sacis').numbers().get(), [31], here + 'number-words after addWords')
  t.end()
})

test('typeahead:', function (t) {
  nlp.typeahead(['curupira', 'boitatá', 'boitatás'])
  // only the last word is filled-in
  const doc = nlp('o curup')
  t.equal(doc.match('curupira').found, true, here + 'a prefix matches the full word')
  t.equal(doc.text(), 'o curup', here + 'text is unchanged')
  t.equal(doc.autoFill().text(), 'o curupira', here + 'autoFill')
  t.equal(nlp('o boit').match('boitatá').found, false, here + 'an ambiguous prefix')
  t.equal(nlp('o curup dorme').match('curupira').found, false, here + 'not in the middle')
  t.end()
})
