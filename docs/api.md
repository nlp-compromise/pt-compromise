# API

`pt-compromise` é construído sobre a biblioteca em inglês [compromise](https://github.com/spencermountain/compromise/), e compartilha os seus métodos básicos. Eles funcionam do mesmo jeito em todas as línguas.

A maioria dos métodos devolve uma nova **visão** (uma seleção do documento), por isso eles podem ser encadeados:

```js
nlp(texto).match('#Substantivo').first().text()
```

Os métodos que recebem um `match` usam a [sintaxe dos padrões](./match.md).

## Métodos básicos

_(disponíveis em todas as visões)_

### Utilitários

- **`.found`** _[getter]_ — esta visão contém alguma coisa?
- **`.docs`** _[getter]_ — a lista de objetos de termo desta visão
- **`.document`** _[getter]_ — o texto analisado por inteiro
- **`.pointer`** _[getter]_ — os índices da visão atual
- **`.fullPointer`** _[getter]_ — os índices explícitos da visão atual
- **`.methods`** _[getter]_ — acesso aos métodos internos da biblioteca
- **`.model`** _[getter]_ — acesso aos dados internos da biblioteca
- **`.hooks`** _[getter]_ — quais métodos compute rodam por padrão
- **`.isView`** _[getter]_ — ajuda a reconhecer um objeto do compromise
- **`.length`** _[getter]_ — o número de resultados na visão
- **`.update(pointer)`** — cria uma nova visão, a partir deste documento
- **`.toView(pointer)`** — transforma uma visão Verb ou Noun em uma visão normal
- **`.fromText(text)`** — cria um novo documento
- **`.termList()`** — alias de .docs
- **`.compute(method)`** — roda uma operação nomeada sobre o documento
- **`.clone(shallow?)`** — copia o documento por inteiro, sem manter nenhuma referência

### Laços

- **`.forEach(fn)`** — roda uma função em cada resultado, como um documento à parte
- **`.map(fn, emptyResult?)`** — passa cada resultado por uma função, e cria um novo documento
- **`.filter(fn)`** — mantém só os resultados que devolvem true
- **`.find(fn)`** — devolve um documento só com o primeiro resultado que serve
- **`.some(fn)`** — devolve true se pelo menos um resultado serve
- **`.random(n?)`** — sorteia uma parte dos resultados

### Acesso

- **`.terms(n?)`** — divide os resultados em termos individuais
- **`.groups(name?)`** — pega um grupo de captura com nome
- **`.eq(n)`** — usa só o n-ésimo resultado
- **`.first(n?)`** — usa só o primeiro resultado (ou os primeiros)
- **`.last(n?)`** — usa só o último resultado (ou os últimos)
- **`.firstTerms()`** — a primeira palavra de cada resultado
- **`.lastTerms()`** — a última palavra de cada resultado
- **`.slice(start, end?)`** — pega uma parte dos resultados
- **`.all()`** — devolve o documento original inteiro ("afastar o zoom")
- **`.fullSentences()`** — devolve a frase original completa de cada resultado
- **`.none()`** — devolve uma visão vazia
- **`.isDoc(view?)`** — estas duas visões são do mesmo documento?
- **`.wordCount()`** — conta o número de termos

### Busca

- **`.match(match, group?, options?)`** — devolve as partes do documento que correspondem ao padrão
- **`.matchOne(match, group?, options?)`** — devolve só o primeiro resultado
- **`.has(match, group?, options?)`** — devolve um booleano: este padrão existe?
- **`.if(match, group?, options?)`** — mantém só os resultados que contêm este padrão
- **`.ifNo(match, group?, options?)`** — descarta os resultados que contêm este padrão
- **`.before(match, group?, options?)`** — devolve os termos antes de cada resultado
- **`.after(match, group?, options?)`** — devolve os termos depois de cada resultado
- **`.lookBehind(match, group?, options?)`** — alias de .before()
- **`.lookBefore(match, group?, options?)`** — alias de .before()
- **`.lookAhead(match, group?, options?)`** — alias de .after()
- **`.lookAfter(match, group?, options?)`** — alias de .after()
- **`.growLeft(match, group?, options?)`** — adiciona à visão os termos correspondentes logo antes
- **`.growRight(match, group?, options?)`** — adiciona à visão os termos correspondentes logo depois
- **`.grow(match, group?, options?)`** — expande a visão com os termos correspondentes, à esquerda ou à direita
- **`.sweep(match, opts?)`** — aplica uma série de padrões compilados ao documento
- **`.splitOn(match?, group?)`** — divide o resultado em três: antes, o padrão, e depois
- **`.splitBefore(match?, group?)`** — corta logo antes de cada padrão encontrado
- **`.splitAfter(match?, group?)`** — corta logo depois de cada padrão encontrado
- **`.split(match?, group?)`** — alias de .splitAfter()

### Maiúsculas e minúsculas

- **`.toLowerCase()`** — passa todas as letras para minúsculas
- **`.toUpperCase()`** — passa todas as letras para maiúsculas
- **`.toTitleCase()`** — põe em maiúscula a primeira letra de cada termo
- **`.toCamelCase()`** — remove os espaços e põe uma maiúscula em cada termo

### Inserção

- **`.concat(input)`** — adiciona estes itens no fim
- **`.insertBefore(input)`** — adiciona estas palavras antes de cada resultado
- **`.prepend(input)`** — alias de .insertBefore()
- **`.insertAfter(text)`** — adiciona estas palavras depois de cada resultado
- **`.append(text)`** — alias de .insertAfter()
- **`.insert(text)`** — alias de .insertAfter()
- **`.remove(match)`** — remove estes termos do documento por completo
- **`.delete(match)`** — alias de .remove()
- **`.replace(from, to?, keep?)`** — busca um padrão e o substitui por um novo conteúdo
- **`.replaceWith(to, keep?)`** — substitui a seleção por um novo conteúdo
- **`.unique()`** — remove os resultados duplicados
- **`.reverse()`** — inverte a ordem dos resultados, mas não a das palavras
- **`.sort(method?)`** — reordena os resultados (no próprio lugar)
<!-- - **`.normalize(options?)`** — limpa vários aspectos das palavras -->

### Espaços e pontuação

- **`.pre(str?, concat?)`** — adiciona esta pontuação ou este espaço antes de cada resultado
- **`.post(str?, concat?)`** — adiciona esta pontuação ou este espaço depois de cada resultado
- **`.trim()`** — remove os espaços do início e do fim
- **`.hyphenate()`** — liga as palavras com hífen, e remove os espaços
- **`.dehyphenate()`** — remove os hífens entre as palavras, e põe espaços
- **`.deHyphenate()`** — alias de .dehyphenate()
- **`.toQuotations(start?, end?)`** — põe as seleções entre aspas
- **`.toQuotation(start?, end?)`** — alias de .toQuotations()
- **`.toParentheses(start?, end?)`** — põe as seleções entre parênteses

### Saída

- **`.text(options?)`** — devolve o documento como texto
- **`.json(options?)`** — devolve os metadados desejados do documento
- **`.debug()`** — mostra o documento atual e as suas etiquetas, de forma legível
- **`.out(format?)`** — alguns formatos de saída com nome
- **`.html(toHighlight)`** — produz uma string html, com tags em volta dos padrões encontrados
- **`.wrap(matches)`** — produz uma saída personalizada em volta dos padrões encontrados

### Ponteiros

- **`.union(match)`** — devolve todos os resultados, sem duplicatas
- **`.and(match)`** — alias de .union()
- **`.intersection(match)`** — devolve só os resultados em comum
- **`.not(match, options?)`** — devolve todos os resultados menos este
- **`.difference(match, options?)`** — alias de .not()
- **`.complement(match)`** — devolve tudo o que não é um resultado
- **`.settle(match)`** — remove as sobreposições entre resultados

### Etiquetas

- **`.tag(tag, reason?)`** — dá esta etiqueta a todos os termos
- **`.tagSafe(tag, reason?)`** — só aplica a etiqueta se ela for compatível com as etiquetas atuais
- **`.unTag(tag, reason?)`** — remove esta etiqueta dos termos
- **`.canBe(tag)`** — devolve só os termos que podem ter esta etiqueta

### Cache

- **`.cache(options?)`** — congela o estado atual do documento, para ganhar velocidade
- **`.uncache(options?)`** — descongela o estado do documento, para que ele possa ser transformado
- **`.freeze()`** — impede que as etiquetas atuais sejam removidas
- **`.unfreeze()`** — permite que as etiquetas atuais sejam alteradas [padrão]

### Listas de palavras

- **`.lookup(trie, opts?)`** — busca rápida de uma lista de palavras
- **`.autoFill()`** — completa os inícios de palavras, a partir do dicionário de autocompletar

<!--
## Métodos do etiquetador

- **`.confidence()`** — medida média da confiança nas etiquetas
- **`.swap(fromLemma, toLemma, guardTag?)`** — substitui de forma inteligente as formas de uma raiz
-->

## Seleções

As seleções são buscas prontas, como `.verbs()` ou `.numbers()`, que devolvem uma visão com métodos adicionais próprios.
Elas são escritas para cada língua, por isso as que estão disponíveis aqui não são as mesmas do inglês.

### `.nouns()`

- **`.nouns()`** — devolve os substantivos do documento
- **`.nouns().conjugate()`** — dá o singular, o plural e o feminino de cada substantivo
- **`.nouns().isPlural()`** — devolve só os substantivos no plural
- **`.nouns().toPlural()`** — põe os substantivos no plural
- **`.nouns().toSingular()`** — põe os substantivos no singular
- **`.nouns().toFeminine()`** — põe os substantivos no feminino

### `.verbs()`

- **`.verbs()`** — devolve os verbos do documento
- **`.verbs().conjugate()`** — dá todas as conjugações de cada verbo
- **`.verbs().toPresentTense()`** — põe os verbos no presente
- **`.verbs().toPastTense()`** — põe os verbos no pretérito perfeito
- **`.verbs().toFutureTense()`** — põe os verbos no futuro
- **`.verbs().toImperfect()`** — põe os verbos no pretérito imperfeito
- **`.verbs().toConditional()`** — põe os verbos no condicional
- **`.verbs().toGerund()`** — põe os verbos no gerúndio
- **`.verbs().toInfinitive()`** — põe os verbos no infinitivo

### `.adjectives()`

- **`.adjectives()`** — devolve os adjetivos do documento
- **`.adjectives().conjugate()`** — dá o masculino, o feminino e os plurais de cada adjetivo

### `.numbers()`

- **`.numbers()`** — devolve os números, escritos em algarismos ou por extenso
- **`.values()`** — alias de .numbers()
- **`.numbers().get()`** — devolve o valor numérico de cada número
- **`.numbers().units()`** — devolve a unidade que vem depois de cada número
- **`.numbers().toNumber()`** — escreve os números em algarismos (`40`)
- **`.numbers().toText()`** — escreve os números por extenso (`quarenta`)
- **`.numbers().toCardinal()`** — transforma em número cardinal (`quarenta`)
- **`.numbers().toOrdinal()`** — transforma em número ordinal (`quadragésimo`)
- **`.numbers().isCardinal()`** — devolve só os números cardinais
- **`.numbers().isOrdinal()`** — devolve só os números ordinais
- **`.numbers().isEqual(n)`** — devolve só os números iguais a n
- **`.numbers().greaterThan(n)`** — devolve só os números maiores que n
- **`.numbers().lessThan(n)`** — devolve só os números menores que n
- **`.numbers().between(min, max)`** — devolve só os números entre min e max
- **`.numbers().set(n)`** — substitui cada número por n
- **`.numbers().add(n)`** — soma n a cada número
- **`.numbers().subtract(n)`** — subtrai n de cada número
- **`.numbers().increment()`** — soma 1 a cada número
- **`.numbers().decrement()`** — subtrai 1 de cada número

## Métodos do construtor

_(chamados no objeto `nlp` importado, e não em uma visão)_

- **`nlp.tokenize(text, lexicon?)`** — analisa o texto sem rodar o etiquetador
- **`nlp.plugin(plugin)`** — adiciona um plugin do compromise
- **`nlp.extend(plugin)`** — alias de nlp.plugin()
- **`nlp.addWords(words, isFrozen?)`** — adiciona novas palavras ao léxico interno
- **`nlp.addTags(tags)`** — adiciona novas etiquetas ao conjunto de etiquetas
- **`nlp.parseMatch(match, opts?)`** — transforma um padrão em json
- **`nlp.buildNet(matches)`** — compila um conjunto de padrões em uma forma mais rápida, para .sweep()
- **`nlp.buildTrie(words)`** — compila uma lista de palavras em uma forma mais rápida, para .lookup()
- **`nlp.typeahead(words)`** — adiciona palavras ao dicionário de autocompletar
- **`nlp.world()`** — acesso aos dados internos da biblioteca
- **`nlp.model()`** — acesso aos dados linguísticos da biblioteca
- **`nlp.methods()`** — acesso aos métodos internos da biblioteca
- **`nlp.hooks()`** — quais funções compute rodam automaticamente
- **`nlp.verbose(toLog?)`** — mostra as decisões do etiquetador, para depuração
- **`nlp.version`** — a versão semver atual da biblioteca
