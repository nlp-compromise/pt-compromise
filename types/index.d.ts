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
  /** only people and animals have one - 'professora', but not for 'livro' */
  feminine?: string
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
  /** re-write people and animals in their feminine form, with their article - 'a professora' */
  toFeminine(n?: number): Nouns
}

export interface Adjectives extends View {
  /** get all gender/plural forms of these adjectives */
  conjugate(n?: number): AdjectiveConjugation[]
}

/** the interpretation of one number */
export interface ParsedNumber {
  hasComma: boolean
  prefix: string
  num: number | null
  suffix: string
  /** the decimal mark that was written - ',' in '3,5' */
  decimal?: string | null
  /** the mark between thousands - '.' in '1.000' */
  group?: string | null
  /** the ending of a numeric ordinal - 'º', '.ª', 'o' */
  ordinal: string | null
  isText: boolean
  isOrdinal: boolean
  isFraction: boolean
  isMoney: boolean
}

export interface Numbers extends View {
  /** get the interpretation of each number */
  parse(n?: number): ParsedNumber[]
  /** get the numeric value of each number - 'vinte e cinco' → 25 */
  get(n?: number): (number | null)[]
  /** json output, with parsed number data for each match - a number returns only the nth match */
  json(n?: number | string | object): any
  /** return the unit following each number - 'km', 'por cento' */
  units(): View
  /** return only ordinal numbers - 'quinto' */
  isOrdinal(): Numbers
  /** return only cardinal numbers - 'cinco' */
  isCardinal(): Numbers
  /** re-write these numbers as digits - 'quarenta' → '40', 'primeira' → '1ª', 'cinco por cento' → '5 %' */
  toNumber(): Numbers
  /** re-write these numbers as words - '40' → 'quarenta', '5€' → 'cinco euros' - a decimal is left alone */
  toText(): Numbers
  /** re-write these numbers as cardinal - 'quadragésimo' → 'quarenta' */
  toCardinal(): Numbers
  /** re-write these numbers as ordinal - 'quarenta' → 'quadragésimo', '40' → '40º' - in words up to 1999 */
  toOrdinal(): Numbers
  /** return only numbers with this value */
  isEqual(n: number): Numbers
  /** alias of .isEqual() */
  equals(n: number): Numbers
  /** return only numbers larger than n */
  greaterThan(n: number): Numbers
  /** return only numbers smaller than n */
  lessThan(n: number): Numbers
  /** return only numbers between min and max */
  between(min: number, max: number): Numbers
  /** alias of .between() */
  isBetween(min: number, max: number): Numbers
  /** set these numbers to n, given as a number or as text ('doze', '12') - 'quarenta' → 'doze' */
  set(n: number | string): Numbers
  /** add n to these numbers - 'quarenta' → 'quarenta e dois' */
  add(n: number | string): Numbers
  /** alias of .add() */
  plus(n: number | string): Numbers
  /** subtract n from these numbers */
  subtract(n: number | string): Numbers
  /** alias of .subtract() */
  minus(n: number | string): Numbers
  /** add 1 to these numbers */
  increment(): Numbers
  /** subtract 1 from these numbers */
  decrement(): Numbers
}

/** options for nlp.fromSpec() */
export interface SpecOptions {
  tags?: 'ignore' | 'use'
  failures?: 'ignore' | 'throw' | 'retain' | 'log'
  verbose?: boolean
}

/** a failed line in a tagging spec */
export interface SpecFailure {
  code: 'length' | 'tags' | 'syntax' | 'match'
  line: number
  text: string
  message: string
  term?: number
  word?: string
  expected?: string[] | number
  actual?: string[] | number
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
  /** return any names of people - with .parse() and .json() */
  people(n?: number): View
  /** return any names of places */
  places(n?: number): View
  /** return any names of organizations */
  organizations(n?: number): View
  /** return people, places, and organizations together */
  topics(n?: number): View
  /** split-up sentences into their clauses */
  clauses(n?: number): View
  /** black-out names, places, emails and other identifying text */
  redact(opts?: object, blockStr?: string, keep?: boolean): View
  /** return text wrapped in (parentheses) */
  parentheses(n?: number): View
  /** return text wrapped in quotation-marks */
  quotations(n?: number): View
  /** return any acronyms - 'F.B.I.' */
  acronyms(n?: number): View
  /** return any words tagged as #Possessive */
  possessives(n?: number): View
  /** return any words tagged as #Honorific */
  honorifics(n?: number): View
  /** return any words tagged as #Abbreviation */
  abbreviations(n?: number): View
  /** return any words tagged as #Conjunction */
  conjunctions(n?: number): View
  /** return any words tagged as #Preposition */
  prepositions(n?: number): View
  /** return any words joined by a hyphen */
  hyphenated(n?: number): View
  /** return any terms split by a slash */
  slashes(n?: number): View
  /** return any #HashTag terms */
  hashTags(n?: number): View
  /** return any #Email terms */
  emails(n?: number): View
  /** return any #Url terms */
  urls(n?: number): View
  /** return any #AtMention terms */
  atMentions(n?: number): View
  /** return any #Emoji terms */
  emoji(n?: number): View
  /** return any #Emoticon terms */
  emoticons(n?: number): View
  /** return any #PhoneNumber terms */
  phoneNumbers(n?: number): View
  /** return any #Address terms */
  addresses(n?: number): View
}

/** parse the given portuguese text */
declare function nlp(text?: string, lexicon?: Lexicon): PtView

declare namespace nlp {
  /** tag only the sentences that may hold this match, and return the matches */
  export function lazy(text: string, match: string | Net): PtView
  /** interpret text without tagging */
  export function tokenize(text: string, lexicon?: Lexicon): PtView
  /** mix in a compromise-plugin */
  export function plugin(plugin: Plugin): any
  /** mix in a compromise-plugin */
  export function extend(plugin: Plugin): any
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
  export function addWords(words: Lexicon, isFrozen?: boolean): any
  /** turn a list of words into a searchable graph */
  export function buildTrie(words: string[]): object
  /** alias for nlp.buildTrie() */
  export function compile(words: string[]): object
  /** compile a set of match objects to a more optimized form */
  export function buildNet(matches: Match[]): Net
  /** add words to the autoFill dictionary */
  export function typeahead(words: Lexicon): any
  /** parse spec text, optionally applying tags or validating its constraints */
  export function fromSpec(spec: string, options?: SpecOptions): PtView & { failures: SpecFailure[] }
  /** returns untagged sentences and failing tagged lines, with validation failures */
  export function testSpec(spec: string, verbose?: boolean, throwError?: boolean): PtView & { failures: SpecFailure[] }
}

export default nlp
