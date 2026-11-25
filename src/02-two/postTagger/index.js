import matches from './matches.js'
import tagArticles from './article-clitic.js'
import config from './article-clitic-pt.js'
import copulaAdjective from './copula-adjective.js'
import tagNumbers from './numbers.js'

// 'a' is an article, a pronoun, and a preposition too
// 'escrevi a ela', 'obrigado a todos'
const aPronoun = new Set('ele,ela,eles,elas,mim,ti,si,nós,vós,você,vocês,todos,todas,ninguém,alguém,isso,isto,aquilo,quem'.split(','))
// 'fui a pé', 'cheguei a tempo', 'daqui a pouco'
const aNoun = new Set('pé,tempo,pouco,cavalo,respeito,sério,bordo,caminho,favor,propósito,princípio'.split(','))
const prepositionA = function (view) {
  const world = view.world
  view.docs.forEach((terms) => {
    terms.forEach((term, i) => {
      const prev = terms[i - 1] || { tags: new Set(), post: '' }
      const next = terms[i + 1]
      // 'vejo-a' is a pronoun
      if (term.normal !== 'a' || !term.tags.has('Determiner') || !next || /-/.test(prev.post)) {
        return
      }
      // 'começou a chover', 'vou a Lisboa', 'dei o livro a Maria'
      const isPrep = ['Infinitive', 'City'].some((tag) => next.tags.has(tag)) || (prev.tags.has('Noun') && !prev.tags.has('Pronoun') && next.tags.has('Person'))
      if (isPrep || aPronoun.has(next.normal) || aNoun.has(next.normal) || prev.implicit === 'aqui') {
        term.tags.clear()
        world.methods.one.setTag([term], 'Preposition', world, false, 'a-preposition')
      }
    })
  })
}

// a noun that ends in '-s' is a plural - but not 'lápis', 'ônibus', 'país'
const nounNumber = function (view) {
  const world = view.world
  const { isSingular } = world.methods.two.transform.noun
  view.docs.forEach((terms) => {
    terms.forEach((term) => {
      const tags = term.tags
      if (tags.has('Noun') && !['Plural', 'Singular', 'Pronoun', 'ProperNoun', 'Possessive'].some((tag) => tags.has(tag)) && !isSingular(term.normal)) {
        world.methods.one.setTag([term], 'Plural', world, false, 'plural-s')
      }
    })
  })
}

const postTagger = function (view) {
  // 'um milhão', 'trinta e uma' - before these words are taken for articles
  tagNumbers(view)
  prepositionA(view)
  nounNumber(view)
  // 'a conta' or 'ela a conta'
  tagArticles(view, config)
  // 'é cara'
  copulaAdjective(view)
  matches(view)
  return view
}
export default postTagger
