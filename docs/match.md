# Sintaxe dos padrões

Esta é a linguagem de padrões que o compromise usa para selecionar partes de um documento.
Ela parece uma expressão regular, mas trabalha com palavras inteiras (termos), e não com caracteres.
É usada por `.match()`, `.has()`, `.if()`, `.not()`, `.before()`, `.replace()` e métodos parecidos.

```js
nlp('o gato dorme').match('#Artigo #Substantivo').text()
// 'o gato'
```

## Referência rápida

| Padrão            | Significado                                       | Exemplo                 | Encontra                             |
| ----------------- | ------------------------------------------------- | ----------------------- | ------------------------------------ |
| `palavra`         | exatamente esta palavra (sem diferenciar maiúsculas) | `dorme`              | "dorme"                              |
| `#Etiqueta`       | qualquer termo com esta [etiqueta](./tagset.md)   | `#Substantivo`          | "gato"                               |
| `.`               | um termo qualquer                                 | `o . dorme`             | "o gato dorme"                       |
| `*`               | zero ou mais termos quaisquer                     | `o * dorme`             | "o gato preto dorme"                 |
| `(a\|b)`          | um ou outro                                       | `(vermelho\|azul)`      | "vermelho" ou "azul"                 |
| `(a && b)`        | um termo que é as duas coisas ao mesmo tempo      | `(jantar && #Verbo)`    | "jantar", só como verbo              |
| `palavra?`        | opcional                                          | `o pequeno? carro`      | "o carro" e "o pequeno carro"        |
| `palavra+`        | um ou mais                                        | `#Adjetivo+`            | "pequeno vermelho"                   |
| `palavra{m,n}`    | entre m e n                                       | `.{2,3}`                | dois ou três termos                  |
| `!palavra`        | qualquer coisa menos isto                         | `o !#Verbo`             | "o gato"                             |
| `^`               | início da frase                                   | `^o`                    | um "o" no início da frase            |
| `$`               | fim da frase                                      | `dorme$`                | um "dorme" no fim da frase           |
| `[palavra]`       | grupo de captura                                  | `preço do [.]`          | "leite"                              |
| `[<nome>palavra]` | grupo de captura com nome                         | `preço do [<coisa>.]`   | "leite", com o nome `coisa`          |
| `{raiz}`          | qualquer forma desta palavra                      | `{andar}`               | "andar", "andamos", "andou"          |
| `~palavra~`       | busca aproximada, para grafias parecidas          | `~organização~`         | "organisação"                        |
| `/regex/`         | uma expressão regular, testada em um só termo     | `/fac?to/`              | "fato", "facto"                      |
| `@método`         | um teste sobre o termo                            | `@isTitleCase`          | "Olá"                                |

Eles podem ser combinados: `#Substantivo+?` é uma sequência opcional de substantivos, e `^[<primeiro>.]` captura o primeiro termo.

## Palavras

Uma palavra simples encontra só essa palavra, sem diferenciar maiúsculas de minúsculas. Ela não encontra as outras formas da palavra:

```js
nlp('nós andamos para o trabalho').has('andamos') // true
nlp('nós andamos para o trabalho').has('andar') // false
```

Use `{andar}` para encontrar todas as formas. Veja [raízes](#raízes) mais abaixo.

## Etiquetas

Uma `#Etiqueta` encontra qualquer termo com essa etiqueta. As etiquetas válidas estão no [conjunto de etiquetas](./tagset.md).

As etiquetas formam uma hierarquia: um `#PrimeiroNome` também é uma `#Pessoa` e um `#Substantivo`.

```js
nlp('o gato dorme').match('#Substantivo').text() // 'gato'
```

Uma etiqueta desconhecida não encontra nada, e não gera erro:

```js
nlp('o gato dorme').match('#Substantivos').found // false
```

Os nomes das etiquetas em português e em inglês podem ser usados indistintamente. Também é possível usar formas no estilo Penn, como `#RB`.

```js
nlp('o gato dorme').match('#Artigo #Substantivo').text() // 'o gato'
nlp('o gato dorme').match('#Determiner #Noun').text() // 'o gato'
```

## Curingas

`.` é exatamente um termo. `*` é qualquer número de termos, inclusive nenhum, e pega o máximo que puder.

```js
nlp('o gato dorme').match('o . dorme').text() // 'o gato dorme'
nlp('o gato preto dorme').match('o * dorme').text() // 'o gato preto dorme'
```

## Opções

`(a|b)` encontra qualquer uma das opções. `(a && b)` exige que o termo satisfaça todas elas, o que é útil para uma palavra que pode ter duas classes gramaticais.

```js
nlp('eu gosto de vermelho e azul').match('(vermelho|azul)').out('array') // ['vermelho', 'azul']
nlp('vamos jantar depois do jantar').match('(jantar && #Verbo)').out('array') // ['jantar']
```

Os grupos não podem ser aninhados. `(grande (vermelho|azul))` não é suportado: use duas chamadas a `.match()`.

## Termos opcionais e repetidos

```js
nlp('o carro').match('o pequeno? carro').text() // 'o carro'
nlp('o pequeno carro').match('o pequeno? carro').text() // 'o pequeno carro'

nlp('um carro pequeno vermelho').match('#Adjetivo+').text() // 'pequeno vermelho'
nlp('a b c d').match('.{2,3}').text() // 'a b c'
```

`{n}` é exatamente n, `{m,n}` é de m a n, `{m,}` é m ou mais, e `{,n}` é até n.

## Negação

```js
nlp('o gato dorme').match('o !#Verbo').text() // 'o gato'
```

## Início e fim

`^` e `$` são o início e o fim de uma frase, e não do documento.

```js
nlp('o gato dorme').match('^o').text() // 'o'
nlp('o gato dorme').match('dorme$').text() // 'dorme'
```

## Grupos de captura

Os colchetes marcam a parte do resultado que você quer guardar. Ela é obtida com `.groups()`, ou passando o grupo como segundo argumento:

```js
const doc = nlp('o preço do leite é alto')
doc.match('preço do [<coisa>.]').groups('coisa').text() // 'leite'
doc.match('preço do [.]', 0).text() // 'leite'
```

Sem nome, os grupos são numerados a partir de 0. Um grupo pode conter mais de um termo.

## Raízes

`{raiz}` encontra todas as formas flexionadas de uma palavra, a partir da sua forma de dicionário:

```js
nlp('nós andamos para o trabalho').match('{andar}').text() // 'andamos'
nlp('ele andou para casa').match('{andar}').text() // 'andou'
```

<!-- As raízes não são calculadas por padrão. Se esta busca não devolver nada, rode `doc.compute('root')` antes. -->

## Busca aproximada

`~palavra~` encontra grafias parecidas, pela distância entre as cadeias de caracteres. O limite padrão é 0,85, e pode ser alterado nas [opções](#opções-de-busca).

```js
nlp('uma organisação').match('~organização~').text() // 'organisação'
```

## Expressões regulares

Uma `/regex/` é testada em um termo de cada vez, por isso não pode abranger duas palavras.

```js
nlp('fato facto').match('/fac?to/').out('array') // ['fato', 'facto']
```

## Testes sobre os termos

`@método` aplica um teste embutido a cada termo. Os mais comuns são `@isTitleCase`, `@isUpperCase`, `@hasComma`, `@hasHyphen`, `@hasContraction` e `@hasQuote`.

```js
nlp('Olá Maria e obrigado').match('@isTitleCase').out('array') // ['Olá', 'Maria']
```

## Opções de busca

`.match()`, `.matchOne()`, `.has()`, `.if()`, `.ifNo()`, `.before()` e `.after()` aceitam um objeto de opções como terceiro argumento, depois do grupo de captura.

| Opção           | Padrão  | Efeito                                                                  |
| --------------- | ------- | ----------------------------------------------------------------------- |
| `fuzzy`         | `0.85`  | a semelhança exigida por um `~palavra~`, de 0 a 1                       |
| `caseSensitive` | `false` | compara com o texto original, e não com a forma normalizada             |
| `noRegex`       | `false` | trata `/regex/` como uma palavra simples, para que nunca seja executada |

```js
nlp('Olá olá').match('Olá', null, { caseSensitive: true }).out('array') // ['Olá']
```

Use `{ noRegex: true }` quando o padrão foi escrito por um usuário, para que uma regex lenta ou inválida não possa ser executada.

## Buscar uma lista de palavras

Para uma lista longa de palavras simples, `.lookup()` é muito mais rápido do que muitas chamadas a `.match()`. Esse método não usa a sintaxe dos padrões, por isso também é seguro para palavras digitadas por um usuário.

```js
nlp('eu vi maria e joão').lookup(['maria', 'joão']).out('array') // ['maria', 'joão']
```

## Reutilizar um padrão

`nlp.parseMatch(str)` analisa um padrão uma única vez, para que ele possa ser usado várias vezes. `nlp.buildNet([...])` compila vários padrões em um só, para rodarem juntos com `.sweep()`. Use os dois quando os mesmos padrões forem aplicados a muito texto.

## O que não é suportado

- **Grupos aninhados.** Use mais de uma chamada a `.match()`.
- **Padrões que atravessam frases.** Cada resultado fica dentro de uma só frase.
- **Uma regex sobre várias palavras.** Uma `/regex/` é testada em um termo de cada vez.

## Quando uma busca não encontra nada

1. Confira se a etiqueta está no [conjunto de etiquetas](./tagset.md).
2. Use `doc.debug()` para ver como cada palavra foi etiquetada.
3. Lembre que uma palavra simples é uma busca exata. Use `{raiz}` para todas as suas formas.
4. Lembre que um padrão não atravessa frases.
