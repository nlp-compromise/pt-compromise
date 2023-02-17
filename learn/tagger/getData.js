import fs from 'fs'
import path from 'path'

import { fileURLToPath } from 'url'
const dir = path.dirname(fileURLToPath(import.meta.url))

let docs = ['ag94ab12', 'ag94ag02', 'ag94de06', 'ag94fe1', 'ag94ja11', 'ag94jl12', 'ag94ju07', 'ag94ma03', 'ag94mr1', 'ag94no01', 'ag94ou04', 'ag94se06', 'br94ab02', 'br94ag01', 'br94de01', 'br94fe1', 'br94ja04', 'br94jl01', 'br94ju01', 'br94ma01', 'br94mr1', 'br94no01', 'br94ou01', 'br94se01', 'co94ab02', 'co94ag01', 'co94de01', 'co94fe1', 'co94ja04', 'co94jl01', 'co94ju01', 'co94ma01', 'co94mr1', 'co94no01', 'co94ou01', 'co94se01', 'di94ab02', 'di94ag01', 'di94de01', 'di94fe1', 'di94ja04', 'di94jl01', 'di94ju01', 'di94ma01', 'di94mr1', 'di94no01', 'di94ou02', 'di94se01', 'es94ab02', 'es94ag01', 'es94de01', 'es94fe1', 'es94ja04', 'es94jl01', 'es94ju01', 'es94ma01', 'es94mr1', 'es94no01', 'es94ou01', 'es94se01', 'fc96ma10', 'fc96ma23', 'if94ab13', 'if94ag03', 'if94de07', 'if94fe16', 'if94ja05', 'if94jl06', 'if94ju01', 'if94ma04', 'if94mr16', 'if94no02', 'if94ou05', 'if94se07', 'il94ab02', 'il94ag01', 'il94de01', 'il94fe1', 'il94ja04', 'il94jl01', 'il94ju01', 'il94ma01', 'il94mr1', 'il94no01', 'il94ou01', 'ma94ab10', 'ma94ag07', 'ma94de04', 'ma94fe13', 'ma94ja16', 'ma94jl03', 'ma94ju05', 'ma94ma01', 'ma94mr13', 'ma94no06', 'ma94ou02', 'ma94se04', 'mu94ab02', 'mu94ag01', 'mu94de01', 'mu94fe1', 'mu94ja04', 'mu94jl01', 'mu94ju01', 'mu94ma01', 'mu94mr1', 'mu94no01', 'mu94ou01', 'mu94se01',]

let mapping = {
  N: 'Noun',
  'N|AP': 'Noun',
  'N|DAD': 'Noun',
  'N|HOR': 'Noun',
  'N|EST': 'Noun',
  'N|DAT': 'Noun',
  'N|TEL': 'Noun',
  NUM: 'Value',
  CUR: 'Money',
  NPROP: 'Noun',
  PROP: 'Noun',
  VAUX: 'Auxiliary',
  'VAUX|+': 'Auxiliary',
  ADJ: 'Adjective',
  'ADJ|+': 'Adjective',
  'ADJ|EST': 'Adjective',
  KC: 'Conjunction',
  'KC|[': 'Conjunction',
  'KC|]': 'Conjunction',
  'KS|[': 'Conjunction',
  'KS|]': 'Conjunction',
  KS: 'Conjunction',
  IN: 'Expression',
  PDEN: 'Expression',
  PCP: 'Participle',
  ADV: 'Adverb',
  'ADV|[': 'Adverb',
  'ADV|]': 'Adverb',
  'ADV|+': 'Adverb',
  'ADV-KS': 'Adverb',
  'ADV|EST': 'Adverb',
  'ADV-KS-REL': 'Adverb',
  V: 'Verb',
  'V|+': 'Verb',
  'V|EST': 'Verb',
  PREP: 'Preposition',
  'PREP|+': 'Preposition',
  'PREP|[': 'Preposition',
  'PREP|]': 'Preposition',
  ART: 'Determiner',
  'ART|+': 'Determiner',
  'PRO-KS-REL': 'Pronoun',
  'PRO-KS': 'Pronoun',
  PROADJ: 'Pronoun',
  PROSUB: 'Pronoun',
  PROPESS: 'Pronoun',
}

let punct = {
  ',': true,
  '"': true,
  ')': true,
  '?': true,
  '!': true,
  '(': true,
  '[': true,
  ']': true,
  '/': true,
  '-': true,
  '$': true,
  ':': true,
  '`': true,
  '=': true,
  ';': true,
  '))': true,
  '((': true,
  '\'': true,
  'Pontuação': true,
}

const getDoc = function (id) {
  let lines = fs.readFileSync(`${dir}/mac_morpho/${id}.txt`, { encoding: 'latin1' }).toString().split('._.')
  lines = lines.map(str => {
    let txt = []
    let words = str.split(/\n/).map(s => {
      let a = s.split(/_/)
      txt.push(a[0])
      let tag = a[1] || ''
      tag = tag.replace(/[+!|\[\]]+$/, '').trim()
      tag = tag.replace(/|EST$/, '')
      tag = tag.replace(/|HOR$/, '')
      // if (tag && !mapping[tag] && !punct[tag]) {
      //   console.log(tag)
      // }
      return {
        word: a[0],
        tag: mapping[tag] || tag,
      }
    })
    words = words.filter(o => o.tag && punct[o.tag])
    return {
      txt: txt.join(' '),
      words
    }
  })
  return lines
}

const getAll = function () {
  let all = []
  docs.forEach(id => {
    all.concat(getDoc(id))
  })
  return all
}
export default getAll
// getDoc(docs[3])
console.log(getAll())