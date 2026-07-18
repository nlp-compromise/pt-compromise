import type View from 'compromise/view/one'
import type { Lexicon, Plugin, matchOptions, Match, Net } from 'compromise/misc'

/** conjugated forms for each grammatical person */
export interface ConjugationSet {
  first?: string
  second?: string
  third?: string
  firstPlural?: string
  secondPlural?: string
  thirdPlural?: string
}

/** all conjugations of a verb */
export interface VerbConjugation {
  Conditional: ConjugationSet
  FutureTense: ConjugationSet
  ImperativeNeg: ConjugationSet
  Imperative: ConjugationSet
  Imperfect: ConjugationSet
  PastTense: ConjugationSet
  Pluperfect: ConjugationSet
  PresentTense: ConjugationSet
  Infinitivo: ConjugationSet
  SubjunctivePresent: ConjugationSet
  SubjunctiveImperfect: ConjugationSet
  SubjunctiveFuture: ConjugationSet
  Gerund: string
  PastParticiple: string
}

export interface NounConjugation {
  singular: string
  plural: string
  feminine: string
}

export interface AdjectiveConjugation {
  male: string
  female: string
  plural: string
  femalePlural: string
}

export interface Verbs extends View {
  /** get all conjugated forms of these verbs */
  conjugate(n?: number): VerbConjugation[]
  /** re-write these verbs in the past-tense - 'falei' */
  toPastTense(n?: number): Verbs
  /** re-write these verbs in the present-tense - 'falo' */
  toPresentTense(n?: number): Verbs
  /** re-write these verbs in the future-tense - 'falarei' */
  toFutureTense(n?: number): Verbs
  /** re-write these verbs in the imperfect - 'falava' */
  toImperfect(n?: number): Verbs
  /** re-write these verbs in the conditional - 'falaria' */
  toConditional(n?: number): Verbs
  /** re-write these verbs as a gerund - 'falando' */
  toGerund(n?: number): Verbs
  /** re-write these verbs as an infinitive - 'falar' */
  toInfinitive(n?: number): Verbs
}

export interface Nouns extends View {
  /** get the singular, plural and feminine forms of these nouns */
  conjugate(n?: number): NounConjugation[]
  /** return only the plural nouns */
  isPlural(n?: number): Nouns
  /** re-write these nouns as plural */
  toPlural(n?: number): Nouns
  /** re-write these nouns as singular */
  toSingular(n?: number): Nouns
  /** re-write these nouns in their feminine form - 'professora' */
  toFeminine(n?: number): Nouns
}

export interface Adjectives extends View {
  /** get all gender/plural forms of these adjectives */
  conjugate(n?: number): AdjectiveConjugation[]
}

export interface Numbers extends View {
  /** parsed number data for each match */
  json(n?: number): object[]
  /** return only unit-terms - 'dólares' */
  units(): View
  /** return only ordinal numbers - 'quinto' */
  isOrdinal(): Numbers
  /** return only cardinal numbers - 'cinco' */
  isCardinal(): Numbers
  /** re-write these numbers as digits - '5' */
  toNumber(): Numbers
  /** re-write these numbers as words - 'cinco' */
  toText(): Numbers
  /** re-write these numbers as cardinal - 'cinco' */
  toCardinal(): Numbers
  /** re-write these numbers as ordinal - 'quinto' */
  toOrdinal(): Numbers
  /** return numbers with this value */
  isEqual(n: number): Numbers
  /** return numbers larger than n */
  greaterThan(n: number): Numbers
  /** return numbers smaller than n */
  lessThan(n: number): Numbers
  /** return numbers between min and max */
  between(min: number, max: number): Numbers
  /** set these numbers to n */
  set(n: number): Numbers
  /** add n to these numbers */
  add(n: number): Numbers
  /** subtract n from these numbers */
  subtract(n: number): Numbers
  /** add 1 to these numbers */
  increment(): Numbers
  /** subtract 1 from these numbers */
  decrement(): Numbers
}

/** a compromise document, with portuguese-specific methods */
export interface PtView extends View {
  /** return any verbs, with conjugation methods */
  verbs(n?: number): Verbs
  /** return any nouns, with inflection methods */
  nouns(n?: number): Nouns
  /** return any adjectives, with gender/plural methods */
  adjectives(n?: number): Adjectives
  /** return any numbers, with parsing and math methods */
  numbers(n?: number): Numbers
}

/** parse the given portuguese text */
declare function nlp(text?: string, lexicon?: Lexicon): PtView

declare namespace nlp {
  /** interpret text without tagging */
  export function tokenize(text: string, lexicon?: Lexicon): PtView
  /** scan through text with minimal analysis */
  export function lazy(text: string, match?: string): PtView
  /** mix in a compromise-plugin */
  export function plugin(plugin: Plugin): any
  /** turn a match-string into json */
  export function parseMatch(match: string, opts?: matchOptions): object[]
  /** grab library internals */
  export function world(): object
  /** grab library metadata */
  export function model(): object
  /** grab exposed library methods */
  export function methods(): object
  /** which compute functions run automatically */
  export function hooks(): string[]
  /** log our decision-making for debugging */
  export function verbose(toLog?: boolean | string): any
  /** current semver version of the library */
  export const version: string
  /** connect new tags to tagset graph */
  export function addTags(tags: object): any
  /** add new words to internal lexicon */
  export function addWords(words: Lexicon): any
  /** turn a list of words into a searchable graph */
  export function buildTrie(words: string[]): object
  /** compile a set of match objects to a more optimized form */
  export function buildNet(matches: Match[]): Net
  /** add words to the autoFill dictionary */
  export function typeahead(words: Lexicon): any
}

export default nlp
