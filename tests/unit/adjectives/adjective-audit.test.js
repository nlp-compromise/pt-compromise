import test from 'tape'
import nlp from '../../_lib.js'
import list from './_audit.js'
const here = '[adjective-audit] '
nlp.verbose(false)

const before = { male: 'ele é ', female: 'ela é ', plural: 'eles são ', femalePlural: 'elas são ' }

// the string-level transform - with a lexicon to look in, and without it
test('adjective audit, transform:', function (t) {
  const { toFemale, toPlural, toFemalePlural, fromFemale, toSingular, fromFemalePlural, all } = nlp.methods().two.transform.adjective
  const lexicon = nlp.model().one.lexicon
  list.forEach((o) => {
    const { male, female, plural, femalePlural } = o.forms
    t.deepEqual([toFemale(male), toPlural(male), toFemalePlural(male)], [female, plural, femalePlural], here + male)
    const want = [male, male, male]
    t.deepEqual([fromFemale(female), toSingular(plural), fromFemalePlural(femalePlural)], want, here + 'to ' + male)
    t.deepEqual([fromFemale(female, lexicon), toSingular(plural, lexicon), fromFemalePlural(femalePlural, lexicon)], want, here + male + ' (lexicon)')
  })
  t.deepEqual(all('bonito'), ['bonito', 'bonita', 'bonitos', 'bonitas'], here + 'all')
  t.deepEqual(all('feliz'), ['feliz', 'felizes'], here + 'all, common gender')
  t.deepEqual(all('simples'), ['simples'], here + 'all, invariable')
  t.end()
})

// each form, after 'ser'
test('adjective audit, in context:', function (t) {
  list.forEach((o) => {
    Object.keys(o.forms).filter((k) => !o.hmm.includes(k)).forEach((k) => {
      const str = before[k] + o.forms[k]
      t.deepEqual(nlp(str).adjectives().conjugate(), [o.forms], here + str)
    })
  })
  t.end()
})

test('adjective audit, misc:', function (t) {
  const { toFemale, toPlural, fromFemale, toSingular, fromFemalePlural } = nlp.methods().two.transform.adjective
  const lexicon = nlp.model().one.lexicon
  // '-or' adds an '-a', but a comparative does not
  t.equal(toFemale('xyzador'), 'xyzadora', here + '-dor')
  t.equal(toFemale('ulterior'), 'ulterior', here + 'ulterior')
  t.equal(toFemale('incolor'), 'incolor', here + 'incolor')
  t.equal(fromFemale('xyzadora'), 'xyzador', here + '-dora')
  t.equal(fromFemale('sonora'), 'sonoro', here + 'sonora')
  // '-ês' adds one too
  t.equal(toFemale('norueguês'), 'norueguesa', here + 'norueguês')
  t.equal(fromFemale('norueguesa'), 'norueguês', here + 'norueguesa')
  t.equal(fromFemale('obesa'), 'obeso', here + 'obesa')
  // '-ão'
  t.equal(toFemale('catalão'), 'catalã', here + 'catalão')
  t.equal(toFemale('bonitão'), 'bonitona', here + 'bonitão')
  t.equal(toPlural('xyzão'), 'xyzões', here + '-ões')
  // '-a' for both genders
  t.equal(fromFemale('socialista'), 'socialista', here + '-ista')
  t.equal(fromFemale('mista'), 'misto', here + 'mista')
  t.equal(fromFemale('prevista'), 'previsto', here + 'prevista')
  // '-eia' is '-eu', or '-eio'
  t.equal(fromFemale('feia'), 'feio', here + 'feia')
  t.equal(fromFemale('cheia'), 'cheio', here + 'cheia')
  // a lexicon chooses between two masculines
  t.equal(fromFemale('xyza', { xyza: 'Adjective' }), 'xyza', here + 'lexicon hint')
  t.equal(toSingular('azuis', lexicon), 'azul', here + 'azuis')
  t.equal(fromFemalePlural('más'), 'mau', here + 'más')

  // the forms of an adjective are in the lexicon
  t.ok(nlp('carros amarelos').has('#PluralAdjective'), here + 'amarelos is a plural adjective')
  t.ok(nlp('uma casa antiga').has('#FemaleAdjective'), here + 'antiga is a feminine adjective')
  t.ok(nlp('casas antigas').has('#FemaleAdjective$') && nlp('casas antigas').has('#PluralAdjective$'), here + 'antigas')
  t.notOk(nlp('é fácil').has('#FemaleAdjective'), here + 'fácil has no gender')
  // after 'ser' or 'estar', a noun, a verb-form or a name is an adjective that we know
  t.ok(nlp('a casa é cara').has('#FemaleAdjective$'), here + 'é cara')
  t.ok(nlp('a cara dela').match('cara').has('#Noun'), here + 'a cara')
  t.ok(nlp('ela é muito bonita').has('#Adjective$'), here + 'é muito bonita')
  t.ok(nlp('eles são estrangeiros').has('#PluralAdjective$'), here + 'são estrangeiros')
  t.ok(nlp('os estrangeiros chegaram').has('^os #Plural'), here + 'os estrangeiros')
  t.notOk(nlp('é Bonita').has('#Adjective'), here + 'é Bonita')
  // root
  const doc = nlp('as casas são bonitas e eles são altos').compute('root')
  t.equal(doc.match('bonitas').json()[0].terms[0].root, 'bonito', here + 'root, feminine plural')
  t.equal(doc.match('altos').json()[0].terms[0].root, 'alto', here + 'root, plural')
  t.end()
})
