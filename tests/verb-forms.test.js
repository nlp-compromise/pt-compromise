import test from 'tape'
import nlp from './_lib.js'
let here = '[verb-forms] '

test('escoicear:', function (t) {
  let vb = {
    "Infinitive": ["escoicear"],
    "Presente": ["escoiceie", "escoiceies", "escoiceie", "escoiceemos", "escoiceeis", "escoiceiem"],
    // "Pretérito Imperfeito": ["escoiceasse", "escoiceasses", "escoiceasse", "escoiceássemos", "escoiceásseis", "escoiceassem"],
    "Pretérito Perfeito": ["escoiceei", "escoiceaste", "escoiceou", "escoiceamos", "escoiceastes", "escoicearam"],
    "Pretérito Mais-que-perfeito": ["escoiceara", "escoicearas", "escoiceara", "escoiceáramos", "escoiceáreis", "escoicearam"],
    "Futuro do Presente": ["escoicearei", "escoicearás", "escoiceará", "escoicearemos", "escoiceareis", "escoicearão"],
    "Futuro do Pretérito": ["escoicearia", "escoicearias", "escoicearia", "escoicearíamos", "escoicearíeis", "escoiceariam"],
    // "Futuro": ["escoicear", "escoiceares", "escoicear", "escoicearmos", "escoiceardes", "escoicearem"],
    "Imperativo Afirmativo": ["escoiceia", "escoiceie", "escoiceemos", "escoiceai", "escoiceiem"],
    "Imperativo Negativo": ["escoiceies", "escoiceie", "escoiceemos", "escoiceeis", "escoiceiem"],
    // "Infinitivo Pessoal": ["escoicear", "escoiceares", "escoicear", "escoicearmos", "escoiceardes", "escoicearem"]
  }
  Object.keys(vb).forEach(form => {
    vb[form].forEach(str => {
      let doc = nlp(str)
      t.equal(doc.has('#Verb'), true, here + `'${str}' is ${form}  #Verb`)
    })
  })
  t.end()
})

test('pronunciar', function (t) {
  let vb = {
    "word": ["pronunciar"],
    "Presente": ["pronuncio", "pronuncias", "pronuncia", "pronunciamos", "pronunciais", "pronunciam"],
    "Pretérito Imperfeito": ["pronunciava", "pronunciavas", "pronunciava", "pronunciávamos", "pronunciáveis", "pronunciavam"],
    "Pretérito Perfeito": ["pronunciei", "pronunciaste", "pronunciou", "pronunciamos", "pronunciastes", "pronunciaram"],
    "Pretérito Mais-que-perfeito": ["pronunciara", "pronunciaras", "pronunciara", "pronunciáramos", "pronunciáreis", "pronunciaram"],
    "Futuro do Presente": ["pronunciarei", "pronunciarás", "pronunciará", "pronunciaremos", "pronunciareis", "pronunciarão"],
    "Futuro do Pretérito": ["pronunciaria", "pronunciarias", "pronunciaria", "pronunciaríamos", "pronunciaríeis", "pronunciariam"],
    // "Futuro": ["pronunciar", "pronunciares", "pronunciar", "pronunciarmos", "pronunciardes", "pronunciarem"],
    "Imperativo Afirmativo": ["pronuncia", "pronuncie", "pronunciemos", "pronunciai", "pronunciem"],
    "Imperativo Negativo": ["pronuncies", "pronuncie", "pronunciemos", "pronuncieis", "pronunciem"],
    "Infinitivo Pessoal": ["pronunciar", "pronunciares", "pronunciar", "pronunciarmos", "pronunciardes", "pronunciarem"]
  }

  Object.keys(vb).forEach(form => {
    vb[form].forEach(str => {
      let doc = nlp(str)
      t.equal(doc.has('#Verb'), true, here + `'${str}' is ${form} #Verb`)
    })
  })
  t.end()
})
test('ter', function (t) {
  let vb = {
    "word": ["ter"],
    "Presente": ["tenho", "tens", "tem", "temos", "tendes", "têm"],
    "Pretérito Imperfeito": ["tinha", "tinhas", "tinha", "tínhamos", "tínheis", "tinham"],
    "Pretérito Perfeito": ["tive", "tiveste", "teve", "tivemos", "tivestes", "tiveram"],
    "Pretérito Mais-que-perfeito": ["tivera", "tiveras", "tivera", "tivéramos", "tivéreis", "tiveram"],
    "Futuro do Presente": ["terei", "terás", "terá", "teremos", "tereis", "terão"],
    "Futuro do Pretérito": ["teria", "terias", "teria", "teríamos", "teríeis", "teriam"],
    // "Futuro": ["tiver", "tiveres", "tiver", "tivermos", "tiverdes", "tiverem"],
    "Imperativo Afirmativo": ["tem", "tenha", "tenhamos", "tende", "tenham"],
    "Imperativo Negativo": ["tenhas", "tenha", "tenhamos", "tenhais", "tenham"],
    "Infinitivo Pessoal": ["ter", "teres", "ter", "termos", "terdes", "terem"]
  }
  Object.keys(vb).forEach(form => {
    vb[form].forEach(str => {
      let doc = nlp(str)
      t.equal(doc.has('#Verb'), true, here + `'${str}' is ${form} #Verb`)
    })
  })
  t.end()
})
test('gesticular', function (t) {
  let vb = {
    "word": ["gesticular"],
    "Presente": ["gesticulo", "gesticulas", "gesticula", "gesticulamos", "gesticulais", "gesticulam"],
    "Pretérito Imperfeito": ["gesticulava", "gesticulavas", "gesticulava", "gesticulávamos", "gesticuláveis", "gesticulavam"],
    "Pretérito Perfeito": ["gesticulei", "gesticulaste", "gesticulou", "gesticulamos", "gesticulastes", "gesticularam"],
    "Pretérito Mais-que-perfeito": ["gesticulara", "gesticularas", "gesticulara", "gesticuláramos", "gesticuláreis", "gesticularam"],
    "Futuro do Presente": ["gesticularei", "gesticularás", "gesticulará", "gesticularemos", "gesticulareis", "gesticularão"],
    "Futuro do Pretérito": ["gesticularia", "gesticularias", "gesticularia", "gesticularíamos", "gesticularíeis", "gesticulariam"],
    // "Futuro": ["gesticular", "gesticulares", "gesticular", "gesticularmos", "gesticulardes", "gesticularem"],
    "Imperativo Afirmativo": ["gesticula", "gesticule", "gesticulemos", "gesticulai", "gesticulem"],
    // "Imperativo Negativo": ["gesticules", "gesticule", "gesticulemos", "gesticuleis", "gesticulem"],
    "Infinitivo Pessoal": ["gesticular", "gesticulares", "gesticular", "gesticularmos", "gesticulardes", "gesticularem"]

  }
  Object.keys(vb).forEach(form => {
    vb[form].forEach(str => {
      let doc = nlp(str)
      t.equal(doc.has('#Verb'), true, here + `'${str}' is ${form} #Verb`)
    })
  })
  t.end()
})
