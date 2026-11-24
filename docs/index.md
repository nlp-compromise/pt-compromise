# pt-compromise

`pt-compromise` é uma biblioteca JavaScript para analisar texto em português.

Ela divide o texto em frases e palavras, e atribui a cada palavra uma etiqueta com a sua classe gramatical.
Depois, partes do documento podem ser selecionadas, de um jeito parecido com uma expressão regular, ou transformadas.

A biblioteca é pequena o bastante para rodar no navegador, funciona offline e não tem dependências.
Ela é baseada em regras e é configurável. Toma decisões rápidas e "boas o suficiente", e não usa um modelo neural.

Esta é uma versão em português da [biblioteca em inglês](https://github.com/spencermountain/compromise/) original.

```bash
npm install pt-compromise
```

```js
import nlp from 'pt-compromise'

const doc = nlp('Ela encontra conchas na praia.')
doc.match('#Verbo').text() // 'encontra'
```

ou no navegador:

```html
<script src="https://unpkg.com/pt-compromise"></script>
```

### Documentação

- [Conjunto de etiquetas](./tagset.md)
- [Sintaxe dos padrões](./match.md)
- [API](./api.md)
- [Como contribuir](./contributing.md)

### Como funciona

O texto é dividido em uma lista de frases, e cada frase em uma lista de termos:

```
Sentence [
  Term { text: 'Ela', pre: '', post: ' ', normal: 'ela', tags: ['Noun', 'Pronoun'] },
  Term { text: 'encontra', pre: '', post: ' ', normal: 'encontra', tags: ['Verb', 'PresentTense', 'ThirdPerson'] },
  ...
]
```

- `text` é a palavra como foi escrita
- `pre` e `post` são os espaços e a pontuação em volta dela
- `normal` é uma versão limpa, usada nas buscas
- `tags` são as suas [etiquetas gramaticais](./tagset.md)

Esses dados podem ser obtidos com `.json()`:

```js
const doc = nlp('Ela encontra conchas na praia.')
doc.json()
// [{ terms: [{ text: 'Ela', tags: ['Noun', 'Pronoun'], ... }, ...] }]
```

### Buscar

Para selecionar partes do documento, use `.match()`:

```js
const doc = nlp('Ela encontra conchas na praia.')
const m = doc.match('#Pronome encontra .')
m.text() // 'Ela encontra conchas'
m.json() // [{ text: 'Ela encontra conchas', terms: [...] }]

doc.has('#Verbo #Substantivo') // true
doc.match('#Substantivo').out('array') // ['Ela', 'conchas', 'praia.']
```

Veja a [sintaxe dos padrões](./match.md) para tudo o que um padrão pode fazer, e o [conjunto de etiquetas](./tagset.md) para a lista de etiquetas disponíveis.

### Transformar

Partes do documento podem ser transformadas, e a mudança é aplicada ao documento original:

```js
const doc = nlp('Ela encontra conchas na praia.')
doc.match('conchas').replaceWith('roupas de banho')
doc.text() // 'Ela encontra roupas de banho na praia.'
```

Também há seleções prontas, como `.verbs()`, `.nouns()` e `.numbers()`, que têm métodos próprios, como `.conjugate()` ou `.toPastTense()`:

```js
const doc = nlp('Ela encontra conchas na praia.')
doc.nouns().length // 3 ('Ela', 'conchas', 'praia')

doc.verbs().toPastTense()
doc.text() // 'Ela encontrou conchas na praia.'

nlp('O cachorro persegue o gato.').nouns().conjugate()
// [{ singular: 'cachorro', plural: 'cachorros', feminine: 'cachorra' }, { singular: 'gato', plural: 'gatos', feminine: 'gata' }]
```

Essas seleções mudam de uma língua para outra. Veja a [API](./api.md) para as que existem nesta biblioteca.

### Bom saber

**Todo método devolve uma visão.** Uma visão é uma seleção de termos no documento. `nlp(texto)` é uma visão do documento inteiro, e `.match()` devolve uma menor. A maioria dos métodos devolve uma visão, por isso eles podem ser encadeados. Use `.all()` para voltar ao documento inteiro.

**As transformações alteram o próprio documento.** A visão que uma transformação devolve contém só a seleção, por isso leia o resultado a partir do documento original:

```js
const doc = nlp('Ela encontra conchas na praia.')
doc.match('conchas').replaceWith('pedrinhas').text() // 'pedrinhas' (só a seleção)
doc.text() // 'Ela encontra pedrinhas na praia.'
```

Para não mexer no original, trabalhe em uma cópia com `.clone()`:

```js
const doc = nlp('Ela encontra conchas na praia.')
const copia = doc.clone()
copia.match('conchas').remove()
copia.text() // 'Ela encontra na praia.'
doc.text() // 'Ela encontra conchas na praia.'
```

**Um padrão não atravessa frases.**

```js
nlp('Isso é tudo. De volta a Winnipeg!').has('tudo de volta') // false
```

**Uma etiqueta desconhecida não encontra nada, e não dá erro.** Se uma busca voltar vazia, confira a etiqueta no [conjunto de etiquetas](./tagset.md), e use `doc.debug()` para mostrar como cada palavra foi etiquetada.

### Configuração

Se uma palavra foi etiquetada errado, ou está faltando, você mesmo pode fornecê-la:

```js
// para um único documento
nlp('kermit acenou', { kermit: 'PrimeiroNome' }).match('#PrimeiroNome').text() // 'kermit'

// para todos os documentos
nlp.addWords({ kermit: 'PrimeiroNome' })
```

As etiquetas precisam vir do [conjunto de etiquetas](./tagset.md), ou ser adicionadas com `nlp.addTags()`.

Um plugin pode adicionar palavras, etiquetas e novos métodos de uma vez:

```js
nlp.plugin({
  words: { kermit: 'PrimeiroNome' },
  tags: { Muppet: { isA: 'Pessoa' } },
  api: (View) => {
    View.prototype.exclamar = function () {
      return this.post('!')
    }
  }
})

const doc = nlp('olá pessoal')
doc.match('pessoal').exclamar()
doc.text() // 'olá pessoal!'
```
