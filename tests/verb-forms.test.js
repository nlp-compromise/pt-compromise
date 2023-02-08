import test from 'tape'
import nlp from './_lib.js'
let here = '[verb-forms] '

test('escoicear:', function (t) {
  let vb = {
    "Infinitive": ["escoicear"],
    "Presente": ["escoiceie", "escoiceies", "escoiceie", "escoiceemos", "escoiceeis", "escoiceiem"],
    "Pretérito Imperfeito": ["escoiceasse", "escoiceasses", "escoiceasse", "escoiceássemos", "escoiceásseis", "escoiceassem"],
    "Pretérito Perfeito": ["escoiceei", "escoiceaste", "escoiceou", "escoiceamos", "escoiceastes", "escoicearam"],
    "Pretérito Mais-que-perfeito": ["escoiceara", "escoicearas", "escoiceara", "escoiceáramos", "escoiceáreis", "escoicearam"],
    // "Futuro do Presente": ["escoicearei", "escoicearás", "escoiceará", "escoicearemos", "escoiceareis", "escoicearão"],
    "Futuro do Pretérito": ["escoicearia", "escoicearias", "escoicearia", "escoicearíamos", "escoicearíeis", "escoiceariam"],
    "Futuro": ["escoicear", "escoiceares", "escoicear", "escoicearmos", "escoiceardes", "escoicearem"],
    "Imperativo Afirmativo": ["escoiceia", "escoiceie", "escoiceemos", "escoiceai", "escoiceiem"],
    "Imperativo Negativo": ["escoiceies", "escoiceie", "escoiceemos", "escoiceeis", "escoiceiem"],
    "Infinitivo Pessoal": ["escoicear", "escoiceares", "escoicear", "escoicearmos", "escoiceardes", "escoicearem"]
  }
  Object.keys(vb).forEach(form => {
    vb[form].forEach(str => {
      let doc = nlp(str)
      t.equal(doc.has('#Verb'), true, here + `'${str}' is #Verb`)
    })
  })
  t.end()
})

test('pronunciar', function (t) {
  let vb = {
    "Infinitive": ["pronunciar"],
    "Presente": ["pronuncie", "pronuncies", "pronuncie", "pronunciemos", "pronuncieis", "pronunciem"],
    "Pretérito Imperfeito": ["pronunciasse", "pronunciasses", "pronunciasse", "pronunciássemos", "pronunciásseis", "pronunciassem"],
    "Pretérito Perfeito": ["pronunciei", "pronunciaste", "pronunciou", "pronunciamos", "pronunciastes", "pronunciaram"],
    "Pretérito Mais-que-perfeito": ["pronunciara", "pronunciaras", "pronunciara", "pronunciáramos", "pronunciáreis", "pronunciaram"],
    // "Futuro do Presente": ["pronunciarei", "pronunciarás", "pronunciará", "pronunciaremos", "pronunciareis", "pronunciarão"],
    "Futuro do Pretérito": ["pronunciaria", "pronunciarias", "pronunciaria", "pronunciaríamos", "pronunciaríeis", "pronunciariam"],
    "Futuro": ["pronunciar", "pronunciares", "pronunciar", "pronunciarmos", "pronunciardes", "pronunciarem"],
    "Imperativo Afirmativo": ["pronuncia", "pronuncie", "pronunciemos", "pronunciai", "pronunciem"],
    "Imperativo Negativo": ["pronuncies", "pronuncie", "pronunciemos", "pronuncieis", "pronunciem"],
    "Infinitivo Pessoal": ["pronunciar", "pronunciares", "pronunciar", "pronunciarmos", "pronunciardes", "pronunciarem"]
  }
  Object.keys(vb).forEach(form => {
    vb[form].forEach(str => {
      let doc = nlp(str)
      t.equal(doc.has('#Verb'), true, here + `'${str}' is #Verb`)
    })
  })
  t.end()
})
