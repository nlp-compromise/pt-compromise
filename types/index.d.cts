// CommonJS exports the callable directly; share its API with the ESM declarations.
import type esm from './index.js' with { "resolution-mode": "import" }
import type * as api from './index.js' with { "resolution-mode": "import" }

declare const nlp: typeof esm
declare namespace nlp {
  export type ConjugationSet = api.ConjugationSet
  export type VerbConjugation = api.VerbConjugation
  export type NounConjugation = api.NounConjugation
  export type AdjectiveConjugation = api.AdjectiveConjugation
  export type Verbs = api.Verbs
  export type Nouns = api.Nouns
  export type Adjectives = api.Adjectives
  export type Numbers = api.Numbers
  export type PtView = api.PtView
}

export = nlp
