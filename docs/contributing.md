# Como contribuir

Esta biblioteca é um trabalho em andamento, e depende da ajuda tanto de desenvolvedores quanto de falantes de português.

Não é preciso saber programar para ajudar. Avisar sobre uma palavra etiquetada errado, em uma [issue](https://github.com/nlp-compromise/pt-compromise/issues), já é uma contribuição útil. Você pode escrever em português ou em inglês.

Todos os pull-requests são bem-vindos, e são revisados sem demora. Esta biblioteca é open-source, sob a licença MIT.

### Instalação

Crie um fork pessoal do repositório no GitHub, e depois:

```bash
git clone git@github.com:{SEU_USUARIO}/pt-compromise.git
cd pt-compromise
pnpm install
pnpm test
```

Este projeto usa [pnpm](https://pnpm.io/). `npm install` e `npm test` também funcionam.

### Fazer uma alteração

- `./src` contém o código. Ele é dividido em `01-one` (divisão em palavras), `02-two` (etiquetagem) e `03-three` (seleções como `.verbs()`).
- `./data` contém as listas de palavras e os modelos. Eles são comprimidos, por isso rode `pnpm run pack` depois de alterá-los para ver o resultado.
- `./tests` contém os testes. Por favor, adicione um teste para a sua alteração.
- `./scratch.js` é um arquivo para fazer experiências. `pnpm run watch` roda o arquivo de novo cada vez que você salva.

Para ver como uma frase foi etiquetada, use `.debug()`:

```js
nlp('Ela encontra conchas na praia.').debug()
```

### Enviar um pull-request

Por favor, trabalhe a partir do branch `dev`, e envie o seu pull-request para ele.

Se a sua alteração for grande, por favor crie uma issue antes, para podermos conversar sobre ela.
