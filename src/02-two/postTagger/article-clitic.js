// some articles are also object-pronouns - and the word after them may be a noun, or a verb
// this is the decision, and it knows no language - the words, tags and endings all come from a config object:
//
//  articles      - {word: {plural, not, but}} - each article, whether it is plural, and the endings that can not
//                  follow it as a noun ('not'), apart from some exceptions ('but')
//  clitics       - Set of the articles that are also object-pronouns
//  verbBefore    - Set of words that an object-pronoun follows - a subject-pronoun, a negation
//  clauseBefore  - Set of words that either one may follow - a conjunction, an adverb
//  joins         - Set of coordinating conjunctions
//  quantifiers   - {word: article} - words that come before their own article
//  nounAfter     - Set of words that follow a noun, and not a verb - 'of'
//  verbEnding    - RegExp of a present-tense ending that few nouns have
//  pluralEnding  - RegExp of the ending of a plural noun
//  nouns         - Set of words that are a noun after an article, whatever their tag
//  nonFinite, nounForm, weak, present, pluralPerson, afterVerb, homograph, skip - lists of tags
//  hyphen        - true if an object-pronoun may hang from a hyphen
//  initial       - true if an object-pronoun may begin a sentence
//  isNoun(str, world)   - do we know this word as a noun?
//  getVerb(term, world) - tags of the verb-form that this term also is, if it has another tag
//
// the cues, in order:
//  1. is this article a pronoun at all? is it an object, after a verb or a preposition?
//  2. is there a subject-pronoun, or a negation, before it?
//  3. can the word follow this article, as a noun?
//  4. is it a real verb-form, that is not a noun that we know?
//  5. is there a subject before it, and no verb yet?
//  6. what comes after it?

const getStr = (term) => term.implicit || term.normal
const has = (term, tag) => Boolean(term) && term.tags.has(tag)
const hasAny = (term, tags) => Boolean(term) && tags.some((tag) => term.tags.has(tag))
const hasPunct = (term) => /[,;:.!?]/.test(term.post || '')
const isLower = (term) => !/\p{Lu}/u.test(term.text)

const tagArticles = function (view, config) {
  const world = view.world
  const setTag = world.methods.one.setTag
  const { articles, clitics, verbBefore, clauseBefore } = config
  const retag = function (term, tags, reason) {
    term.tags.clear()
    setTag([term], tags, world, false, reason)
  }
  const agrees = function (art, str) {
    const o = articles[art]
    return !o.not.test(str) || o.but.test(str)
  }

  view.docs.forEach((terms) => {
    // the verb-form that this term is, or also is
    const verbs = terms.map((term) => {
      if (has(term, 'Verb')) {
        return hasAny(term, config.nonFinite) ? null : Array.from(term.tags)
      }
      return isLower(term) && hasAny(term, config.homograph) ? config.getVerb(term, world) : null
    })
    const isFinite = (n) => Boolean(verbs[n]) && has(terms[n], 'Verb')
    // a noun that we know - not a name, or a word that the tagger guessed
    const isKnown = (n) => !hasAny(terms[n], ['Verb', 'ProperNoun']) || config.isNoun(terms[n].normal, world)
    // does a verb begin here? - '[is] high', '[it pays] John', '[not] going'
    const verbAt = function (n) {
      while (hasAny(terms[n], ['Adverb', 'Negative'])) {
        n += 1
      }
      const term = terms[n]
      if (term && (clitics.has(getStr(term)) || verbBefore.has(getStr(term)))) {
        return isFinite(n + 1)
      }
      return isFinite(n)
    }
    // is there already a verb in this clause?
    const verbBehind = function (n) {
      for (n -= 1; n >= 0 && !hasPunct(terms[n]) && !clauseBefore.has(getStr(terms[n])); n -= 1) {
        if (isFinite(n)) {
          return true
        }
      }
      return false
    }
    let choose = null
    // what do the words after it say?
    const lookAfter = function (i) {
      const next = terms[i + 1]
      if (!next || hasPunct(terms[i])) {
        return null
      }
      if (hasAny(next, config.nonFinite)) {
        return 'Verb'
      }
      if (verbAt(i + 1) || config.nounAfter.has(getStr(next)) || has(next, 'Adjective')) {
        return 'Noun'
      }
      // 'buys it and sells it', but 'the houses and the cat'
      if (config.joins.has(getStr(next)) && terms[i + 2]) {
        if (clitics.has(getStr(terms[i + 2])) && verbs[i + 3]) {
          return choose(i + 2)
        }
        return verbAt(i + 2) ? 'Verb' : 'Noun'
      }
      return hasAny(next, config.afterVerb) ? 'Verb' : null
    }
    // is the verb-form after this article a noun, or a verb?
    choose = function (i) {
      const art = getStr(terms[i])
      const str = terms[i + 1].normal
      const tags = verbs[i + 1]
      const prev = terms[i - 1]
      const before = prev && !hasPunct(prev) ? getStr(prev) : ''
      // 1.
      if (!clitics.has(art) || config.quantifiers[before] === art || (!before && !config.initial)) {
        return 'Noun'
      }
      if (before && (has(prev, 'Preposition') || has(prev, 'Verb'))) {
        return 'Noun'
      }
      // 2. - but 'to her' is not a subject
      const isObject = has(terms[i - 2], 'Preposition')
      if (verbBefore.has(before) && !(isObject && has(prev, 'Pronoun'))) {
        return 'Verb'
      }
      // 3.
      if (!agrees(art, str)) {
        return 'Verb'
      }
      // 4.
      const known = isKnown(i + 1)
      if (!known && config.pluralPerson.some((tag) => tags.includes(tag))) {
        return 'Verb'
      }
      const isPresent = config.present.some((tag) => tags.includes(tag))
      const isWeak = config.weak.some((tag) => tags.includes(tag))
      if (isWeak) {
        return clauseBefore.has(before) && lookAfter(i + 1) !== 'Noun' ? 'Verb' : 'Noun'
      }
      if (!known && (!isPresent || config.verbEnding.test(str))) {
        // .. unless the tagger only guessed that it is a verb
        return terms[i + 1].confidence < 1 && lookAfter(i + 1) === 'Noun' ? 'Noun' : 'Verb'
      }
      // 5.
      const after = lookAfter(i + 1)
      const isPhrase = has(prev, 'Noun') && hasAny(terms[i - 2], ['Determiner', 'Possessive']) && !has(terms[i - 3], 'Preposition')
      const isSubject = ((hasAny(prev, ['ProperNoun', 'Pronoun']) && !isObject) || isPhrase) && !has(prev, 'Possessive') && !clauseBefore.has(before)
      if (before && isSubject && after !== 'Noun' && !verbBehind(i)) {
        return 'Verb'
      }
      // 6.
      if (known) {
        return after === 'Verb' && before ? 'Verb' : 'Noun'
      }
      return after || (clauseBefore.has(before) ? 'Verb' : 'Noun')
    }

    for (let i = 0; i < terms.length; i += 1) {
      const art = getStr(terms[i])
      const term = terms[i + 1]
      if (!articles.hasOwnProperty(art) || !has(terms[i], 'Determiner')) {
        continue
      }
      // a pronoun that hangs from its verb
      if (config.hyphen && /-/.test((terms[i - 1] || {}).post + terms[i].post)) {
        if (clitics.has(art) && has(terms[i - 1], 'Verb')) {
          retag(terms[i], 'Pronoun', 'clitic-hyphen')
        }
        continue
      }
      if (!term || hasPunct(terms[i]) || !isLower(term)) {
        continue
      }
      const next = hasPunct(term) ? null : terms[i + 2]
      if (config.nouns.has(term.normal) || (hasAny(term, config.nounForm) && agrees(art, term.normal) && !has(next, 'Noun'))) {
        // a word that is a noun, after any article - 'the afternoon', 'the dinner', 'the guests'
        retag(term, 'Noun', 'article-noun')
      } else if (verbs[i + 1] && !hasAny(term, config.skip)) {
        if (choose(i) === 'Verb') {
          retag(terms[i], 'Pronoun', 'clitic-verb')
          if (!has(term, 'Verb')) {
            retag(term, ['Verb'].concat(verbs[i + 1]), 'clitic-verb')
          }
          continue
        }
        if (has(term, 'Verb')) {
          retag(term, 'Noun', 'article-noun')
        }
      }
      // an adjective with no noun after it is the noun - 'the young arrived'
      if (has(term, 'Adjective')) {
        const isNoun = verbs[i + 2] && has(next, 'Verb') && !hasAny(next, config.skip) && agrees(art, next.normal) && isLower(next)
        if (isNoun && config.present.concat(config.weak).some((tag) => has(next, tag))) {
          retag(next, 'Noun', 'article-noun')
        } else if (!has(next, 'Noun') && !(has(next, 'Adjective') && has(terms[i + 3], 'Noun'))) {
          retag(term, 'Noun', 'article-adjective')
        }
      }
      if (!has(term, 'Noun') || has(term, 'Pronoun')) {
        continue
      }
      // a name in lower-case is not a name
      if (has(term, 'ProperNoun')) {
        retag(term, 'Noun', 'article-noun')
      }
      // the article knows the number of a noun that does not show it
      if (articles[art].plural && config.pluralEnding.test(term.normal)) {
        setTag([term], 'Plural', world, false, 'plural-article')
      } else if (!articles[art].plural && has(term, 'Plural')) {
        setTag([term], 'Singular', world, false, 'singular-article')
      }
    }
  })
}
export default tagArticles
