### Unreleased

- **[change]** - typescript types rewritten from the real api - core `View` types now come from `compromise`, and the document type is `PtView`
- **[new]** - types for `nlp.fromSpec()`, `nlp.testSpec()` and `nlp.compile()`
- **[change]** - remove `nlp.lazy()` from types and docs - it lives in a plugin now
- **[change]** - minimum node version is 18
- **[update]** - tests moved to `tests/unit`, `tests/types`, `tests/_hmm` and `tests/_backlog`
- **[update]** - suffix-thumb 6.1.0

### 0.0.6 [Nov 2026]

- **[update]** - smaller suffix-thumb format
- **[new]** - support localized tag names
- **[update]** - dependencies

### 0.0.5 [Sep 2026]

- **[change]** - add typescript types
- **[update]** - dependencies

### 0.0.4 [Jul 2026]

- **[new]** - subjunctive conjugation + tagging
- **[new]** - portuguese suffix-patterns, more tagger rules
- **[new]** - compound tenses - 'tenho falado', 'tinha saído'
- **[new]** - verb transforms - `.verbs().toPastTense()` etc
- **[new]** - noun gender - `.nouns().toFeminine()`, feminine forms in lexicon
- **[new]** - mesoclisis + clitic allomorphs - 'dar-te-ei', 'dão-no'
- **[fix]** - typescript types
- **[fix]** - tagging of common words - 'está', 'não', clitic pronouns
- **[fix]** - conjugation data cleanup, imperative person-mapping
- **[update]** - dependencies

### 0.0.2 [Feb 2023]

- **[new]** - number parsing
- **[new]** - verb conjugation
- **[new]** - tagger - 80% accuracy

### 0.0.1 [Feb 2023]

- **[new]** - tokenization
