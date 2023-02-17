import test from 'tape'
import nlp from './_lib.js'
const here = '[api] '

test('api:', function (t) {
  let obj = {
    "word": "ter",
    "Presente": ["tenha", "tenhas", "tenha", "tenhamos", "tenhais", "tenham"],
    "Pretérito Imperfeito": ["tivesse", "tivesses", "tivesse", "tivéssemos", "tivésseis", "tivessem"],
    "Pretérito Perfeito": ["tive", "tiveste", "teve", "tivemos", "tivestes", "tiveram"],
    "Pretérito Mais-que-perfeito": ["tivera", "tiveras", "tivera", "tivéramos", "tivéreis", "tiveram"],
    "Futuro do Presente": ["terei", "terás", "terá", "teremos", "tereis", "terão"],
    "Futuro do Pretérito": ["teria", "terias", "teria", "teríamos", "teríeis", "teriam"],
    "Futuro": ["tiver", "tiveres", "tiver", "tivermos", "tiverdes", "tiverem"],
    "Imperativo Afirmativo": ["tem", "tenha", "tenhamos", "tende", "tenham"],
    "Imperativo Negativo": ["tenhas", "tenha", "tenhamos", "tenhais", "tenham"],
    "Infinitivo Pessoal": ["ter", "teres", "ter", "termos", "terdes", "terem"]
  }



  t.end()
})