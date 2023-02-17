<div align="center">
  <img height="15px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>
  <div><b>pt-compromise</b></div>
  <img src="https://user-images.githubusercontent.com/399657/68222691-6597f180-ffb9-11e9-8a32-a7f38aa8bded.png"/>
  <div>processamento de linguagem natural modesto em javascript</div>
  <div><code>npm install pt-compromise</code></div>
  <div align="center">
    <sub>
        trabalho em progresso!  •  work-in-progress!
    </sub>
  </div>
  <img height="25px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>
</div>

<div align="center">
  <div>
    <a href="https://npmjs.org/package/pt-compromise">
    <img src="https://img.shields.io/npm/v/pt-compromise.svg?style=flat-square" />
  </a>
  <!-- <a href="https://codecov.io/gh/spencermountain/pt-compromise">
    <img src="https://codecov.io/gh/spencermountain/pt-compromise/branch/master/graph/badge.svg" />
  </a> -->
  <a href="https://bundlephobia.com/result?p=pt-compromise">
    <img src="https://img.shields.io/bundlephobia/min/pt-compromise"/>
  </a>
  </div>
  <div align="center">
    <sub>
     ver: <a href="https://github.com/nlp-compromise/it-compromise">italian</a> • <a href="https://github.com/nlp-compromise/de-compromise">german</a> • <a href="https://github.com/nlp-compromise/fr-compromise">french</a> • <a href="https://github.com/spencermountain/compromise">english</a> • <a href="https://github.com/spencermountain/es-compromise">spanish</a>
    </sub>
  </div>
</div>


<!-- spacer -->
<img height="85px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>


`pt-compromise` é uma porta de [compromise](https://github.com/nlp-compromise/compromise) em português

O objetivo deste projeto é fornecer um identificador de PDV pequeno, básico e baseado em regras.

<p><i ><sub>
  (this project is a small, basic, rule-based POS tagger!)
</sub></i></p>

<!-- spacer -->
<img height="15px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>

```js
import nlp from 'pt-compromise'

let doc = nlp('Ouviram do Ipiranga as margens plácidas')
doc.match('#Adjective').out('array')
// [ 'plácidas' ]
```

<!-- spacer -->
<img height="15px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>

ou no navegador:
```html
<script src="https://unpkg.com/pt-compromise"></script>
<script>
  let txt = 'De um povo heroico o brado retumbante'
  let doc = esCompromise(txt) // window.esCompromise
  console.log(doc.json())
  // { text:'De um...', terms:[ ... ] }
</script>
```

## API
**pt-compromise** inclui todos os métodos em `compromise/one`:

<details>
  <summary><h3>clique aqui para ver a API</h3></summary>

##### Output

- **[.text()](https://observablehq.com/@spencermountain/compromise-text)** - return the document as text
- **[.json()](https://observablehq.com/@spencermountain/compromise-json)** - return the document as data
- **[.debug()](https://observablehq.com/@spencermountain/compromise-output)** - pretty-print the interpreted document
- **[.out()](https://observablehq.com/@spencermountain/compromise-output)** - a named or custom output
- **[.html({})](https://observablehq.com/@spencermountain/compromise-html)** - output custom html tags for matches
- **[.wrap({})](https://observablehq.com/@spencermountain/compromise-output)** - produce custom output for document matches

##### Utils

- **[.found](https://observablehq.com/@spencermountain/compromise-utils)** _[getter]_ - is this document empty?
- **[.docs](https://observablehq.com/@spencermountain/compromise-utils)** _[getter]_ get term objects as json
- **[.length](https://observablehq.com/@spencermountain/compromise-utils)** _[getter]_ - count the # of characters in the document (string length)
- **[.isView](https://observablehq.com/@spencermountain/compromise-utils)** _[getter]_ - identify a compromise object
- **[.compute()](https://observablehq.com/@spencermountain/compromise-compute)** - run a named analysis on the document
- **[.clone()](https://observablehq.com/@spencermountain/compromise-utils)** - deep-copy the document, so that no references remain
- **[.termList()](https://observablehq.com/@spencermountain/compromise-accessors)** - return a flat list of all Term objects in match
- **[.cache({})](https://observablehq.com/@spencermountain/compromise-cache)** - freeze the current state of the document, for speed-purposes
- **[.uncache()](https://observablehq.com/@spencermountain/compromise-cache)** - un-freezes the current state of the document, so it may be transformed

##### Accessors

- **[.all()](https://observablehq.com/@spencermountain/compromise-utils)** - return the whole original document ('zoom out')
- **[.terms()](https://observablehq.com/@spencermountain/compromise-selections)** - split-up results by each individual term
- **[.first(n)](https://observablehq.com/@spencermountain/compromise-accessors)** - use only the first result(s)
- **[.last(n)](https://observablehq.com/@spencermountain/compromise-accessors)** - use only the last result(s)
- **[.slice(n,n)](https://observablehq.com/@spencermountain/compromise-accessors)** - grab a subset of the results
- **[.eq(n)](https://observablehq.com/@spencermountain/compromise-accessors)** - use only the nth result
- **[.firstTerms()](https://observablehq.com/@spencermountain/compromise-accessors)** - get the first word in each match
- **[.lastTerms()](https://observablehq.com/@spencermountain/compromise-accessors)** - get the end word in each match
- **[.fullSentences()](https://observablehq.com/@spencermountain/compromise-accessors)** - get the whole sentence for each match
- **[.groups()](https://observablehq.com/@spencermountain/compromise-accessors)** - grab any named capture-groups from a match
- **[.wordCount()](https://observablehq.com/@spencermountain/compromise-utils)** - count the # of terms in the document
- **[.confidence()](https://observablehq.com/@spencermountain/compromise-utils)** - an average score for pos tag interpretations

##### Match

_(match methods use the [match-syntax](https://docs.compromise.cool/compromise-match-syntax).)_

- **[.match('')](https://observablehq.com/@spencermountain/compromise-match)** - return a new Doc, with this one as a parent
- **[.not('')](https://observablehq.com/@spencermountain/compromise-match)** - return all results except for this
- **[.matchOne('')](https://observablehq.com/@spencermountain/compromise-match)** - return only the first match
- **[.if('')](https://observablehq.com/@spencermountain/compromise-match)** - return each current phrase, only if it contains this match ('only')
- **[.ifNo('')](https://observablehq.com/@spencermountain/compromise-match)** - Filter-out any current phrases that have this match ('notIf')
- **[.has('')](https://observablehq.com/@spencermountain/compromise-match)** - Return a boolean if this match exists
- **[.before('')](https://observablehq.com/@spencermountain/compromise-match)** - return all terms before a match, in each phrase
- **[.after('')](https://observablehq.com/@spencermountain/compromise-match)** - return all terms after a match, in each phrase
- **[.union()](https://observablehq.com/@spencermountain/compromise-pointers)** - return combined matches without duplicates
- **[.intersection()](https://observablehq.com/@spencermountain/compromise-pointers)** - return only duplicate matches
- **[.complement()](https://observablehq.com/@spencermountain/compromise-pointers)** - get everything not in another match
- **[.settle()](https://observablehq.com/@spencermountain/compromise-pointers)** - remove overlaps from matches
- **[.growRight('')](https://observablehq.com/@spencermountain/compromise-match)** - add any matching terms immediately after each match
- **[.growLeft('')](https://observablehq.com/@spencermountain/compromise-match)** - add any matching terms immediately before each match
- **[.grow('')](https://observablehq.com/@spencermountain/compromise-match)** - add any matching terms before or after each match
- **[.sweep(net)](https://observablehq.com/@spencermountain/compromise-sweep)** - apply a series of match objects to the document
- **[.splitOn('')](https://observablehq.com/@spencermountain/compromise-split)** - return a Document with three parts for every match ('splitOn')
- **[.splitBefore('')](https://observablehq.com/@spencermountain/compromise-split)** - partition a phrase before each matching segment
- **[.splitAfter('')](https://observablehq.com/@spencermountain/compromise-split)** - partition a phrase after each matching segment
- **[.lookup([])](https://observablehq.com/@spencermountain/compromise-match)** - quick find for an array of string matches
- **[.autoFill()](https://observablehq.com/@spencermountain/compromise-typeahead)** - create type-ahead assumptions on the document

##### Tag

- **[.tag('')](https://observablehq.com/@spencermountain/compromise-tagger)** - Give all terms the given tag
- **[.tagSafe('')](https://observablehq.com/@spencermountain/compromise-tagger)** - Only apply tag to terms if it is consistent with current tags
- **[.unTag('')](https://observablehq.com/@spencermountain/compromise-tagger)** - Remove this term from the given terms
- **[.canBe('')](https://observablehq.com/@spencermountain/compromise-tagger)** - return only the terms that can be this tag

##### Case

- **[.toLowerCase()](https://observablehq.com/@spencermountain/compromise-case)** - turn every letter of every term to lower-cse
- **[.toUpperCase()](https://observablehq.com/@spencermountain/compromise-case)** - turn every letter of every term to upper case
- **[.toTitleCase()](https://observablehq.com/@spencermountain/compromise-case)** - upper-case the first letter of each term
- **[.toCamelCase()](https://observablehq.com/@spencermountain/compromise-case)** - remove whitespace and title-case each term

##### Whitespace

- **[.pre('')](https://observablehq.com/@spencermountain/compromise-whitespace)** - add this punctuation or whitespace before each match
- **[.post('')](https://observablehq.com/@spencermountain/compromise-whitespace)** - add this punctuation or whitespace after each match
- **[.trim()](https://observablehq.com/@spencermountain/compromise-whitespace)** - remove start and end whitespace
- **[.hyphenate()](https://observablehq.com/@spencermountain/compromise-whitespace)** - connect words with hyphen, and remove whitespace
- **[.dehyphenate()](https://observablehq.com/@spencermountain/compromise-whitespace)** - remove hyphens between words, and set whitespace
- **[.toQuotations()](https://observablehq.com/@spencermountain/compromise-whitespace)** - add quotation marks around these matches
- **[.toParentheses()](https://observablehq.com/@spencermountain/compromise-whitespace)** - add brackets around these matches

##### Loops

- **[.map(fn)](https://observablehq.com/@spencermountain/compromise-loops)** - run each phrase through a function, and create a new document
- **[.forEach(fn)](https://observablehq.com/@spencermountain/compromise-loops)** - run a function on each phrase, as an individual document
- **[.filter(fn)](https://observablehq.com/@spencermountain/compromise-loops)** - return only the phrases that return true
- **[.find(fn)](https://observablehq.com/@spencermountain/compromise-loops)** - return a document with only the first phrase that matches
- **[.some(fn)](https://observablehq.com/@spencermountain/compromise-loops)** - return true or false if there is one matching phrase
- **[.random(fn)](https://observablehq.com/@spencermountain/compromise-loops)** - sample a subset of the results

##### Insert

- **[.replace(match, replace)](https://observablehq.com/@spencermountain/compromise-insert)** - search and replace match with new content
- **[.replaceWith(replace)](https://observablehq.com/@spencermountain/compromise-insert)** - substitute-in new text
- **[.remove()](https://observablehq.com/@spencermountain/compromise-insert)** - fully remove these terms from the document
- **[.insertBefore(str)](https://observablehq.com/@spencermountain/compromise-insert)** - add these new terms to the front of each match (prepend)
- **[.insertAfter(str)](https://observablehq.com/@spencermountain/compromise-insert)** - add these new terms to the end of each match (append)
- **[.concat()](https://observablehq.com/@spencermountain/compromise-insert)** - add these new things to the end
- **[.swap(fromLemma, toLemma)](https://observablehq.com/@spencermountain/compromise-insert)** - smart replace of root-words,using proper conjugation

##### Transform

- **[.sort('method')](https://observablehq.com/@spencermountain/compromise-sorting)** - re-arrange the order of the matches (in place)
- **[.reverse()](https://observablehq.com/@spencermountain/compromise-sorting)** - reverse the order of the matches, but not the words
- **[.normalize({})](https://observablehq.com/@spencermountain/compromise-normalization)** - clean-up the text in various ways
- **[.unique()](https://observablehq.com/@spencermountain/compromise-sorting)** - remove any duplicate matches


##### Lib

_(these methods are on the main `nlp` object)_

- **[nlp.tokenize(str)](https://observablehq.com/@spencermountain/compromise-tokenization)** - parse text without running POS-tagging
- **[nlp.lazy(str, match)](https://observablehq.com/@spencermountain/compromise-performance)** - scan through a text with minimal analysis
- **[nlp.plugin({})](https://observablehq.com/@spencermountain/compromise-constructor-methods)** - mix in a compromise-plugin
- **[nlp.parseMatch(str)](https://observablehq.com/@spencermountain/compromise-constructor-methods)** - pre-parse any match statements into json
- **[nlp.world()](https://observablehq.com/@spencermountain/compromise-constructor-methods)** - grab or change library internals
- **[nlp.model()](https://observablehq.com/@spencermountain/compromise-constructor-methods)** - grab all current linguistic data
- **[nlp.methods()](https://observablehq.com/@spencermountain/compromise-constructor-methods)** - grab or change internal methods
- **[nlp.hooks()](https://observablehq.com/@spencermountain/compromise-constructor-methods)** - see which compute methods run automatically
- **[nlp.verbose(mode)](https://observablehq.com/@spencermountain/compromise-constructor-methods)** - log our decision-making for debugging
- **[nlp.version](https://observablehq.com/@spencermountain/compromise-constructor-methods)** - current semver version of the library

- **[nlp.addWords(obj)](https://observablehq.com/@spencermountain/compromise-plugin)** - add new words to the lexicon
- **[nlp.addTags(obj)](https://observablehq.com/@spencermountain/compromise-plugin)** - add new tags to the tagSet
- **[nlp.typeahead(arr)](https://observablehq.com/@spencermountain/compromise-typeahead)** - add words to the auto-fill dictionary
- **[nlp.buildTrie(arr)](https://observablehq.com/@spencermountain/compromise-lookup)** - compile a list of words into a fast lookup form
- **[nlp.buildNet(arr)](https://observablehq.com/@spencermountain/compromise-sweep)** - compile a list of matches into a fast match form

<!-- spacer -->
<img height="30px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>
</details>

<div align="right">
  <a href="https://docs.compromise.cool">docs</a>
</div>
<div align="center">
  <img height="50px" src="https://user-images.githubusercontent.com/399657/68221837-0d142480-ffb8-11e9-9d30-90669f1b897c.png"/>
</div>
<!-- spacer -->
<img height="30px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>


### Números
interpretar números escritos
```js
let doc = nlp('cinquenta e cinco dólares')
doc.numbers().minus(10)
doc.text()
// 'quarenta e cinco dólares'
```

<div align="right">
  <a href="https://docs.compromise.cool/compromise-numbers">number docs</a>
</div>
<div align="center">
  <img height="50px" src="https://user-images.githubusercontent.com/399657/68221814-05ed1680-ffb8-11e9-8b6b-c7528d163871.png"/>
</div>
<!-- spacer -->
<img height="30px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>

### Lematização
encontrar a forma raiz das palavras
```js
let doc = nlp('tiramos nuestros zapatos')
doc.compute('root')
doc.has('{tirar} nuestros {zapato}')
//true
```

<div align="right">
  <a href="https://docs.compromise.cool/compromise-root">root docs</a>
</div>
<!-- spacer -->
<img height="85px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>


### Contribuyendo
por favor junte-se para ajudar! - please join to help!

*help with first PR[1](https://github.com/spencermountain/compromise/wiki/Contributing)*
```
git clone https://github.com/nlp-compromise/pt-compromise.git
cd pt-compromise
npm install
npm test
npm watch
```

<div align="center">
  <img src="https://user-images.githubusercontent.com/399657/68221731-e8b84800-ffb7-11e9-8453-6395e0e903fa.png"/>
</div>

## Veja também
- &nbsp; **[Spacy/pt](https://spacy.io/models/pt)** - Spacy portuguese tagger
- &nbsp; **[LXTagger](http://lxcenter.di.fc.ul.pt/tools/en/LXTaggerEN.html)** - Java/cli script from University of Lisbon
- &nbsp; **[brenomatos/portuguese-pos-tagging](https://github.com/brenomatos/portuguese-pos-tagging)** - Keras-based POS tagger
- &nbsp; **[luizppa/portuguese-pos-tagging](https://github.com/luizppa/portuguese-pos-tagging)** - by Luiz Philippe

MIT
