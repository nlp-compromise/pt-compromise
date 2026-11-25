### Unreleased

- **[change]** - typescript types rewritten from the real api - core `View` types now come from `compromise`, and the document type is `PtView`
- **[new]** - types for `nlp.fromSpec()`, `nlp.testSpec()` and `nlp.compile()`
- **[change]** - remove `nlp.lazy()` from types and docs - it lives in a plugin now
- **[fix]** - `.nouns().isPlural()` finds plural nouns - it was matching a tag the tagger never sets
- **[fix]** - noun plurals are made by rules now, not a trained model - 'papel' → 'papéis', 'fóssil' → 'fósseis', 'pão' → 'pães', 'mês' → 'meses', 'lápis' → 'lápis' - and back again
- **[fix]** - adjective forms are made by rules too - 'comum' → 'comuns', 'gentil' → 'gentis', 'melhor' → 'melhores', 'europeu' → 'europeia', 'simples'
- **[fix]** - `.nouns().toPlural()`, `.toSingular()` and `.toFeminine()` change the article, and its contraction - 'do menino' → 'dos meninos', 'o senhor' → 'a senhora'
- **[fix]** - `.nouns().toFeminine()` knows irregular pairs ('o pai' → 'a mãe', 'o cavalo' → 'a égua'), keeps a plural ('os meninos' → 'as meninas'), and only changes the article of 'o estudante'
- **[change]** - only people and animals have a feminine - `.nouns().conjugate()` has no `feminine` for 'livro'
- **[change]** - `.nouns()` returns one noun for each word, like the other languages do - and its transforms skip pronouns
- **[fix]** - 'o', 'a', 'os', 'as' before a verb-form are an article and a noun ('a conta é alta') or a pronoun and a verb ('ele a conta') - and 'a' is a preposition in 'vou a Lisboa'
- **[fix]** - a noun's number comes from its ending, or its article - 'os lápis' is plural, 'o ônibus' and 'o país' are singular
- **[fix]** - an adjective after 'ser' or 'estar' is found, when it is also a noun, a verb or a name - 'é cara', 'são bonitas'
- **[fix]** - `.compute('root')` threw an error on a plural adjective
- **[fix]** - numbers are written with the right 'e' - 'mil e cem', 'mil cento e vinte', 'dois mil e quinhentos', 'um milhão e duzentos mil' - and 'um trilhão' is read and written
- **[fix]** - a number is found one at a time - 'dois mil trezentos e quarenta e cinco' is one number, 'dois três quatro', 'três e quatro' and 'quarenta e 3' are not - and 'mil milhões' is 1,000,000,000
- **[fix]** - a second change to the same `.numbers()` view works - `.add(2).add(1)`, `.set(10).get()`, `.toText().toNumber()` - and the new words are found as a number again
- **[fix]** - 'menos 5', 'três vírgula cinco', 'pelo menos cinco' and 'três menos dois' are read properly - and 'menos' is not a number by itself
- **[fix]** - ordinals keep their gender and number - 'primeira' ↔ 'uma' ↔ '1ª', 'vigésima primeira', 'os primeiros' → 'os segundos' - and 'primeiro', 'undécimo', 'quingentésimo', 'milionésimo' are ordinals
- **[change]** - a numeric ordinal is written with 'º' or 'ª', not the degree sign - '5' → '5º' - and '1.º', '1o', '1a' keep their ending
- **[new]** - '1o' and '1a' are numeric ordinals
- **[new]** - `.numbers().toText()` writes the words for a symbol - '50%' → 'cinquenta por cento', '5€' → 'cinco euros', 'R$ 5' → 'cinco reais', '£1' → 'uma libra', '5km' → 'cinco km' - and `.toNumber()` writes '50 %', '5 euros'
- **[new]** - 'um milhão de euros' - the 'de' comes and goes with the number
- **[new]** - fractions - 'meio', 'um terço', 'três quartos', 'dois e meio', 'um milhão e meio', 'meio milhão'
- **[fix]** - 'um' and 'uma' are a number before a unit ('um euro', 'um km', 'um por cento') or at the end of their phrase ('só tenho um.') - and an article everywhere else, as before
- **[fix]** - feminine numbers are written where the gender is known - 'duzentas casas' + 100 → 'trezentas casas', '2 meninas' → 'duas meninas', 'as 2 casas' → 'as duas casas'
- **[fix]** - 'quatorze', 'cinqüenta' and unaccented 'tres', 'milhoes' are read - 'dezasseis', 'dezassete', 'dezanove' already were
- **[fix]** - 'cinco segundos' is five, 'segunda-feira' is a day and 'segundo o jornal' is a preposition - none of them is a 2
- **[change]** - 'meia' is a half ('duas e meia'), and no longer a six
- **[new]** - `.numbers().set()`, `.add()` and `.subtract()` take a number as text - `.set('doze')` - and `.json(n)` returns the nth number
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
