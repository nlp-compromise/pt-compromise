// compile-time smoke-test for types/index.d.ts
// checked by `pnpm run test:types` - never executed
import nlp from 'pt-compromise'
import type {
  PtView, Verbs, Nouns, Adjectives, Numbers,
  VerbConjugation, NounConjugation, AdjectiveConjugation, ConjugationSet,
} from 'pt-compromise'

const doc: PtView = nlp('a professora falou com os alunos')

// core compromise/one methods are inherited
const txt: string = doc.text()
const found: boolean = doc.has('#Verb')
doc.match('#Noun').tag('Checked').out('array')

// verbs
const verbs: Verbs = doc.verbs()
const conj: VerbConjugation[] = verbs.conjugate()
const past: ConjugationSet = conj[0].PastTense
const firstPerson: string | undefined = past.first
const subj: ConjugationSet = conj[0].SubjunctiveImperfect
const gerund: string = conj[0].Gerund
verbs.toPastTense().toPresentTense().toFutureTense()
verbs.toImperfect().toConditional().toGerund().toInfinitive()
verbs.toPastTense(0)

// nouns
const nouns: Nouns = doc.nouns()
const nounConj: NounConjugation[] = nouns.conjugate()
const feminine: string | undefined = nounConj[0].feminine
nouns.toPlural().toSingular().toFeminine()
nouns.isPlural(0)

// adjectives
const adjs: Adjectives = doc.adjectives()
const adjConj: AdjectiveConjugation[] = adjs.conjugate()
const female: string = adjConj[0].female

// numbers
const nums: Numbers = nlp('cinquenta e cinco').numbers()
nums.toNumber().toText().toOrdinal().toCardinal()
nums.add(5).subtract(2).increment().decrement()
nums.greaterThan(1).lessThan(100).between(1, 100)
nums.isEqual(55).set(60)

// constructor methods
const tokens: PtView = nlp.tokenize('some text')
const ver: string = nlp.version
nlp.verbose(true)
nlp.addWords({ 'skate': 'Noun' })
nlp.addTags({ Checked: { is: 'Noun' } })
nlp.buildTrie(['a', 'b'])
nlp.parseMatch('#Noun')

// @ts-expect-error input text must be a string
nlp(25)

// silence noUnusedLocals
export { txt, found, firstPerson, subj, gerund, feminine, female, tokens, ver }

// spec helpers
const specFailures: import('pt-compromise').SpecFailure[] = nlp.fromSpec('a b', { tags: 'use', failures: 'retain' }).failures
const specDoc: import('pt-compromise').PtView = nlp.testSpec('a b')
nlp.compile(['a', 'b'])
export { specFailures, specDoc }
