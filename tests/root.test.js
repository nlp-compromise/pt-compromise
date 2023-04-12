import test from 'tape'
import nlp from './_lib.js'
let here = '[root-match] '
nlp.verbose(false)

test('root-match:', function (t) {
  let arr = [

    // ==nouns==
    ["cabeça", '{cabeça}'],
    ["cabeças", '{cabeça}'],
    ['título', '{título}'],
    ['títulos', '{título}'],
    ['céu', '{céu}'],
    ['céus', '{céu}'],

    // ===adjectives==
    ["pesado", '{pesado}'],
    ["pesada", '{pesado}'],
    ["pesados", '{pesado}'],
    ["pesadas", '{pesado}'],
    ["agitado", '{agitado}'],
    ["agitada", '{agitado}'],
    ["agitados", '{agitado}'],
    ["agitadas", '{agitado}'],

    // ===verbs===
    // past-tense
    ['nós fomos', '#Pronoun {ir}'],
    // present-tense
    ['Spencer anda devagar', '#Person {andar} .'],
    //  odiar forms
    ['odeiam', '{odiar}'],
    ['odeias', '{odiar}'],
    ['odeie', '{odiar}'],
    ['odeiem', '{odiar}'],
    ['odeies', '{odiar}'],
    ['odeio', '{odiar}'],
    ['odiado', '{odiar}'],
    ['odiais', '{odiar}'],
    ['odiamos', '{odiar}'],
    ['odiar', '{odiar}'],
    ['odiara', '{odiar}'],
    ['odiará', '{odiar}'],
    ['odiaram', '{odiar}'],
    ['odiáramos', '{odiar}'],
    ['odiarão', '{odiar}'],
    ['odiaras', '{odiar}'],
    ['odiarás', '{odiar}'],
    ['odiardes', '{odiar}'],
    ['odiarei', '{odiar}'],
    ['odiáreis', '{odiar}'],
    ['odiareis', '{odiar}'],
    ['odiarem', '{odiar}'],
    ['odiaremos', '{odiar}'],
    ['odiares', '{odiar}'],
    ['odiaria', '{odiar}'],
    ['odiariam', '{odiar}'],
    ['odiaríamos', '{odiar}'],
    ['odiarias', '{odiar}'],
    ['odiaríeis', '{odiar}'],
    ['odiarmos', '{odiar}'],
    ['odiaste', '{odiar}'],
    ['odiastes', '{odiar}'],
    ['odiava', '{odiar}'],
    ['odiavam', '{odiar}'],
    ['odiávamos', '{odiar}'],
    ['odiavas', '{odiar}'],
    ['odiáveis', '{odiar}'],
    ['odiei', '{odiar}'],
    ['odieis', '{odiar}'],
    ['odiemos', '{odiar}'],
    ['odiou', '{odiar}'],
    ["odeia", '{odiar}'],
    ["odeiam", '{odiar}'],
    ["odeias", '{odiar}'],
    ["odeio", '{odiar}'],
    ["odiais", '{odiar}'],
    ["odiamos", '{odiar}'],

    ['as lindas flores cresciam rapidamente', '#Determiner {linda} {flor} {crescer} #Adverb'],
  ]
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str)
    // let tags = doc.json()[0].terms.map(term => term.tags[0])
    // let msg = `'${(str + "' ").padEnd(20, ' ')}  - '${tags.join(', ')}'`
    t.equal(doc.has(match), true, here + str)
  })
  t.end()
})
