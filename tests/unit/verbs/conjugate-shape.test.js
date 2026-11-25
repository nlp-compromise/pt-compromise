import test from 'tape'
import nlp from '../../_lib.js'
const here = '[conjugate-shape] '
nlp.verbose(false)

const persons = ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural']
// there is no command for 'eu'
const commands = ['second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural']
const tenses = ['PresentTense', 'PastTense', 'Imperfect', 'Pluperfect', 'FutureTense', 'Conditional', 'Infinitivo', 'SubjunctivePresent', 'SubjunctiveImperfect', 'SubjunctiveFuture']
const keys = [...tenses, 'Imperative', 'ImperativeNeg', 'Gerund', 'PastParticiple'].sort()
const conjugate = str => nlp(str).verbs().conjugate()[0]

test('conjugate shape:', function (t) {
  const verbs = ['ser', 'ir', 'ter', 'falar', 'comer', 'partir']
  verbs.forEach(inf => {
    const res = nlp(inf).verbs().conjugate()
    t.equal(res.length, 1, here + inf + ' - one result')
    const o = res[0]
    t.deepEqual(Object.keys(o).sort(), keys, here + inf + ' - keys')
    t.deepEqual(Object.keys(o.Imperative), commands, here + inf + ' - imperative persons')
    t.deepEqual(Object.keys(o.ImperativeNeg), commands, here + inf + ' - negative imperative persons')
    tenses.forEach(tense => {
      t.deepEqual(Object.keys(o[tense] || {}), persons, here + inf + ' - ' + tense + ' persons')
      const forms = Object.values(o[tense] || {})
      t.ok(forms.every(str => typeof str === 'string' && str.length > 0), here + inf + ' - ' + tense + ' forms')
    })
    t.equal(typeof o.Gerund, 'string', here + inf + ' - gerund')
    t.equal(typeof o.PastParticiple, 'string', here + inf + ' - participle')
    t.equal(o.Infinitivo.first, inf, here + inf + ' - infinitive')
  })
  t.deepEqual(nlp('o gato preto').verbs().conjugate(), [], here + 'no verb')
  t.end()
})

test('regular verbs:', function (t) {
  const arr = [
    ['falar', 'PresentTense', ['falo', 'falas', 'fala', 'falamos', 'falais', 'falam']],
    ['falar', 'PastTense', ['falei', 'falaste', 'falou', 'falamos', 'falastes', 'falaram']],
    ['falar', 'Imperfect', ['falava', 'falavas', 'falava', 'falávamos', 'faláveis', 'falavam']],
    ['falar', 'FutureTense', ['falarei', 'falarás', 'falará', 'falaremos', 'falareis', 'falarão']],
    ['falar', 'Conditional', ['falaria', 'falarias', 'falaria', 'falaríamos', 'falaríeis', 'falariam']],
    ['falar', 'SubjunctivePresent', ['fale', 'fales', 'fale', 'falemos', 'faleis', 'falem']],
    ['falar', 'SubjunctiveImperfect', ['falasse', 'falasses', 'falasse', 'falássemos', 'falásseis', 'falassem']],
    ['falar', 'Infinitivo', ['falar', 'falares', 'falar', 'falarmos', 'falardes', 'falarem']],
    ['comer', 'PresentTense', ['como', 'comes', 'come', 'comemos', 'comeis', 'comem']],
    ['comer', 'PastTense', ['comi', 'comeste', 'comeu', 'comemos', 'comestes', 'comeram']],
    ['comer', 'Imperfect', ['comia', 'comias', 'comia', 'comíamos', 'comíeis', 'comiam']],
    ['comer', 'FutureTense', ['comerei', 'comerás', 'comerá', 'comeremos', 'comereis', 'comerão']],
    ['comer', 'Conditional', ['comeria', 'comerias', 'comeria', 'comeríamos', 'comeríeis', 'comeriam']],
    ['comer', 'SubjunctivePresent', ['coma', 'comas', 'coma', 'comamos', 'comais', 'comam']],
    ['partir', 'PresentTense', ['parto', 'partes', 'parte', 'partimos', 'partis', 'partem']],
    ['partir', 'PastTense', ['parti', 'partiste', 'partiu', 'partimos', 'partistes', 'partiram']],
    ['partir', 'Imperfect', ['partia', 'partias', 'partia', 'partíamos', 'partíeis', 'partiam']],
    ['partir', 'FutureTense', ['partirei', 'partirás', 'partirá', 'partiremos', 'partireis', 'partirão']],
    ['partir', 'SubjunctivePresent', ['parta', 'partas', 'parta', 'partamos', 'partais', 'partam']],
    ['partir', 'SubjunctiveImperfect', ['partisse', 'partisses', 'partisse', 'partíssemos', 'partísseis', 'partissem']],
  ]
  arr.forEach(a => {
    const [inf, tense, want] = a
    t.deepEqual(Object.values(conjugate(inf)[tense]), want, here + inf + ' ' + tense)
  })
  t.equal(conjugate('falar').Gerund, 'falando', here + 'falando')
  t.equal(conjugate('falar').PastParticiple, 'falado', here + 'falado')
  t.equal(conjugate('comer').Gerund, 'comendo', here + 'comendo')
  t.equal(conjugate('comer').PastParticiple, 'comido', here + 'comido')
  t.equal(conjugate('partir').Gerund, 'partindo', here + 'partindo')
  t.equal(conjugate('partir').PastParticiple, 'partido', here + 'partido')
  // commands
  t.deepEqual(Object.values(conjugate('falar').Imperative), ['fala', 'fale', 'falemos', 'falai', 'falem'], here + 'falar imperative')
  t.deepEqual(Object.values(conjugate('falar').ImperativeNeg), ['fales', 'fale', 'falemos', 'faleis', 'falem'], here + 'falar negative imperative')
  t.deepEqual(Object.values(conjugate('comer').Imperative), ['come', 'coma', 'comamos', 'comei', 'comam'], here + 'comer imperative')
  t.deepEqual(Object.values(conjugate('partir').Imperative), ['parte', 'parta', 'partamos', 'parti', 'partam'], here + 'partir imperative')
  t.end()
})

test('irregular verbs:', function (t) {
  const arr = [
    ['ser', 'PresentTense', ['sou', 'és', 'é', 'somos', 'sois', 'são']],
    ['ser', 'PastTense', ['fui', 'foste', 'foi', 'fomos', 'fostes', 'foram']],
    ['ser', 'Imperfect', ['era', 'eras', 'era', 'éramos', 'éreis', 'eram']],
    ['ser', 'FutureTense', ['serei', 'serás', 'será', 'seremos', 'sereis', 'serão']],
    ['ser', 'Conditional', ['seria', 'serias', 'seria', 'seríamos', 'seríeis', 'seriam']],
    ['ser', 'SubjunctivePresent', ['seja', 'sejas', 'seja', 'sejamos', 'sejais', 'sejam']],
    ['ser', 'SubjunctiveImperfect', ['fosse', 'fosses', 'fosse', 'fôssemos', 'fôsseis', 'fossem']],
    ['ser', 'SubjunctiveFuture', ['for', 'fores', 'for', 'formos', 'fordes', 'forem']],
    ['ir', 'PresentTense', ['vou', 'vais', 'vai', 'vamos', 'ides', 'vão']],
    ['ir', 'PastTense', ['fui', 'foste', 'foi', 'fomos', 'fostes', 'foram']],
    ['ir', 'Imperfect', ['ia', 'ias', 'ia', 'íamos', 'íeis', 'iam']],
    ['ir', 'FutureTense', ['irei', 'irás', 'irá', 'iremos', 'ireis', 'irão']],
    ['ir', 'SubjunctivePresent', ['vá', 'vás', 'vá', 'vamos', 'vades', 'vão']],
    ['ter', 'PresentTense', ['tenho', 'tens', 'tem', 'temos', 'tendes', 'têm']],
    ['ter', 'PastTense', ['tive', 'tiveste', 'teve', 'tivemos', 'tivestes', 'tiveram']],
    ['ter', 'Imperfect', ['tinha', 'tinhas', 'tinha', 'tínhamos', 'tínheis', 'tinham']],
    ['ter', 'FutureTense', ['terei', 'terás', 'terá', 'teremos', 'tereis', 'terão']],
    ['ter', 'Conditional', ['teria', 'terias', 'teria', 'teríamos', 'teríeis', 'teriam']],
    ['ter', 'SubjunctivePresent', ['tenha', 'tenhas', 'tenha', 'tenhamos', 'tenhais', 'tenham']],
    ['ter', 'SubjunctiveImperfect', ['tivesse', 'tivesses', 'tivesse', 'tivéssemos', 'tivésseis', 'tivessem']],
    ['ter', 'SubjunctiveFuture', ['tiver', 'tiveres', 'tiver', 'tivermos', 'tiverdes', 'tiverem']],
  ]
  arr.forEach(a => {
    const [inf, tense, want] = a
    t.deepEqual(Object.values(conjugate(inf)[tense]), want, here + inf + ' ' + tense)
  })
  t.equal(conjugate('ser').Gerund, 'sendo', here + 'sendo')
  t.equal(conjugate('ser').PastParticiple, 'sido', here + 'sido')
  t.equal(conjugate('ir').Gerund, 'indo', here + 'indo')
  t.equal(conjugate('ir').PastParticiple, 'ido', here + 'ido')
  t.equal(conjugate('ter').Gerund, 'tendo', here + 'tendo')
  t.equal(conjugate('ter').PastParticiple, 'tido', here + 'tido')
  t.deepEqual(Object.values(conjugate('ser').Imperative), ['sê', 'seja', 'sejamos', 'sede', 'sejam'], here + 'ser imperative')
  t.deepEqual(Object.values(conjugate('ter').Imperative), ['tem', 'tenha', 'tenhamos', 'tende', 'tenham'], here + 'ter imperative')
  // from a conjugated form
  t.equal(conjugate('nós temos fome').FutureTense.first, 'terei', here + 'temos')
  t.equal(conjugate('eles tiveram sorte').PresentTense.first, 'tenho', here + 'tiveram')
  t.equal(conjugate('eu sou alto').PastTense.third, 'foi', here + 'sou')
  t.equal(conjugate('ela falou muito').PresentTense.firstPlural, 'falamos', here + 'falou')
  t.equal(conjugate('nós comemos pão').Imperfect.third, 'comia', here + 'comemos')
  t.end()
})

test('tense transforms:', function (t) {
  const arr = [
    // [str, past, present, future, imperfect, conditional]
    ['ela fala muito', 'ela falou muito', 'ela fala muito', 'ela falará muito', 'ela falava muito', 'ela falaria muito'],
    ['eu falo muito', 'eu falei muito', 'eu falo muito', 'eu falarei muito', 'eu falava muito', 'eu falaria muito'],
    ['nós comemos pão', 'nós comemos pão', 'nós comemos pão', 'nós comeremos pão', 'nós comíamos pão', 'nós comeríamos pão'],
    ['ela come pão', 'ela comeu pão', 'ela come pão', 'ela comerá pão', 'ela comia pão', 'ela comeria pão'],
    ['eles partem hoje', 'eles partiram hoje', 'eles partem hoje', 'eles partirão hoje', 'eles partiam hoje', 'eles partiriam hoje'],
    ['tu abres a porta', 'tu abriste a porta', 'tu abres a porta', 'tu abrirás a porta', 'tu abrias a porta', 'tu abririas a porta'],
  ]
  const methods = ['toPastTense', 'toPresentTense', 'toFutureTense', 'toImperfect', 'toConditional']
  arr.forEach(a => {
    methods.forEach((fn, i) => {
      const doc = nlp(a[0])
      const res = doc.verbs()[fn]()
      t.equal(doc.text(), a[i + 1], here + a[0] + ' ' + fn)
      t.equal(res.viewType, 'Verbs', here + a[0] + ' ' + fn + ' returns verbs')
    })
  })
  // and back again
  const back = [
    ['ela falou muito', 'toPresentTense', 'ela fala muito'],
    ['ela falará muito', 'toPresentTense', 'ela fala muito'],
    ['ela falava muito', 'toPastTense', 'ela falou muito'],
    ['eles partiram hoje', 'toFutureTense', 'eles partirão hoje'],
    ['ela comeu pão', 'toInfinitive', 'ela comer pão'],
    ['eles partem hoje', 'toGerund', 'eles partindo hoje'],
  ]
  back.forEach(a => {
    const doc = nlp(a[0])
    doc.verbs()[a[1]]()
    t.equal(doc.text(), a[2], here + a[0] + ' ' + a[1])
  })
  // nothing to change
  const doc = nlp('o gato preto')
  doc.verbs().toPastTense()
  t.equal(doc.text(), 'o gato preto', here + 'no verb')
  t.end()
})
