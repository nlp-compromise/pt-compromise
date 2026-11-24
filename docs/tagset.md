# Conjunto de etiquetas

As etiquetas do pt-compromise. Cada etiqueta pode ser usada nos padrões com o nome em inglês ou com o alias em português:

```js
const doc = nlp('o carro é branco')
doc.match('#Artigo #Substantivo #Cópula #Adjetivo')
doc.match('#Determiner #Noun #Copula #Adjective') // equivalente
```

`—` significa que não há alias próprio, porque a palavra é igual em português ou não tem uma boa tradução. O nome em inglês funciona do mesmo jeito.

`*` significa que o etiquetador ainda não atribui esta etiqueta automaticamente a este exemplo. Ela pode ser atribuída com `.tag()`.

## Substantivos

| Inglês | Português | Exemplo |
|---|---|---|
| `#Noun` | `#Substantivo` | `carro` |
| `#Singular` | — | `menina` |
| `#ProperNoun` | `#NomePróprio` | `Lisboa` |
| `#Person` | `#Pessoa` | `Tony` |
| `#FirstName` | `#PrimeiroNome` | `Tony` |
| `#MaleName` | `#NomeMasculino` | `Tony` |
| `#FemaleName` | `#NomeFeminino` | `Maria` |
| `#LastName` | `#Sobrenome` | `Silva` |
| `#Honorific` | `#Título` | `dr` |
| `#Place` | `#Lugar` | `Colorado` |
| `#Country` | `#País` | `Brasil` |
| `#City` | `#Cidade` | `Lisboa` |
| `#Region` | `#Região` | `Quebec` |
| `#Address` | `#Endereço` | `Rua Augusta 5` * |
| `#Organization` | `#Organização` | `Petrobras` * |
| `#SportsTeam` | `#Equipe` | `Flamengo` * |
| `#School` | `#Escola` | `Universidade de Coimbra` * |
| `#Company` | `#Empresa` | `Petrobras` * |
| `#Plural` | — | `carros` |
| `#Uncountable` | `#Incontável` | `água` * |
| `#Pronoun` | `#Pronome` | `eu` |
| `#Actor` | — | `professor` * |
| `#Activity` | `#Atividade` | `natação` * |
| `#Unit` | `#Unidade` | `km` |
| `#Demonym` | `#Gentílico` | `brasileiro` * |
| `#Possessive` | `#Possessivo` | `meu` |
| `#FemaleNoun` | `#SubstantivoFeminino` | `menina` |
| `#MaleNoun` | `#SubstantivoMasculino` | `carro` * |

## Verbos

| Inglês | Português | Exemplo |
|---|---|---|
| `#Verb` | `#Verbo` | `falar` |
| `#PresentTense` | `#Presente` | `falo` |
| `#Infinitive` | `#Infinitivo` | `falar` |
| `#Gerund` | `#Gerúndio` | `falando` |
| `#PastTense` | `#Passado` | `falei` |
| `#FutureTense` | `#Futuro` | `falarei` |
| `#Copula` | `#Cópula` | `é` |
| `#Negative` | `#Negação` | `não` |
| `#Modal` | — | `pode` * |
| `#PerfectTense` | `#PretéritoPerfeito` | `tenho falado` |
| `#Pluperfect` | `#MaisQuePerfeito` | `falara` |
| `#PastParticiple` | `#Particípio` | `falado` |
| `#PhrasalVerb` | — | `dar-se conta` * |
| `#Particle` | — | `dar-se conta` * |
| `#Auxiliary` | `#Auxiliar` | `tem` * |
| `#Conditional` | `#Condicional` | `falaria` |
| `#Reflexive` | `#Reflexivo` | `lavar-se` |
| `#Perfecto` | — | `falado` * |
| `#Imperative` | `#Imperativo` | `fala` * |
| `#Subjunctive` | `#Subjuntivo` | `falasse` |
| `#Imperfect` | `#Imperfeito` | `falava` |
| `#FirstPerson` | `#PrimeiraPessoa` | `falo` |
| `#SecondPerson` | `#SegundaPessoa` | `falas` |
| `#ThirdPerson` | `#TerceiraPessoa` | `fala` |
| `#FirstPersonPlural` | `#PrimeiraPessoaPlural` | `falamos` |
| `#SecondPersonPlural` | `#SegundaPessoaPlural` | `falais` |
| `#ThirdPersonPlural` | `#TerceiraPessoaPlural` | `falam` |

## Números

| Inglês | Português | Exemplo |
|---|---|---|
| `#Value` | `#Número` | `234` |
| `#Ordinal` | — | `segundo` |
| `#Cardinal` | — | `dez` |
| `#Fraction` | `#Fração` | `1/2` |
| `#Multiple` | `#Múltiplo` | `mil` * |
| `#RomanNumeral` | `#NúmeroRomano` | `XIV` * |
| `#TextValue` | `#Numeral` | `dez` |
| `#NumericValue` | `#Numérico` | `234` |
| `#Money` | `#Dinheiro` | `€10` |
| `#Percent` | `#Porcentagem` | `50%` |

## Datas e horas

| Inglês | Português | Exemplo |
|---|---|---|
| `#Date` | `#Data` | `3 de maio` |
| `#Month` | `#Mês` | `junho` |
| `#WeekDay` | `#DiaDaSemana` | `domingo` |
| `#Year` | `#Ano` | `2026` * |
| `#FinancialQuarter` | `#Trimestre` | `Q3` * |
| `#Holiday` | `#Feriado` | `Natal` * |
| `#Season` | `#Estação` | `verão` * |
| `#Timezone` | `#FusoHorário` | `CET` * |
| `#Time` | `#Hora` | `16:30` |
| `#Duration` | `#Duração` | `meses` * |

## Outros

| Inglês | Português | Exemplo |
|---|---|---|
| `#Adjective` | `#Adjetivo` | `vermelho` |
| `#FemaleAdjective` | `#AdjetivoFeminino` | `vermelha` |
| `#MaleAdjective` | `#AdjetivoMasculino` | `perfeitos` |
| `#PluralAdjective` | `#AdjetivoPlural` | `vermelhos` |
| `#SingularAdjective` | `#AdjetivoSingular` | `vermelha` |
| `#Comparable` | `#Comparável` | `rápido` * |
| `#Comparative` | `#Comparativo` | `melhor` * |
| `#Superlative` | `#Superlativo` | `rapidíssimo` * |
| `#NumberRange` | `#IntervaloNumérico` | `5-10` |
| `#Adverb` | `#Advérbio` | `muito` |
| `#Determiner` | `#Determinante`, `#Artigo` | `o` |
| `#Conjunction` | `#Conjunção` | `e` |
| `#Preposition` | `#Preposição` | `em` |
| `#QuestionWord` | `#Interrogativo` | `quando` |
| `#Currency` | `#Moeda` | `euro` * |
| `#Expression` | `#Interjeição` | `oi` * |
| `#Abbreviation` | `#Abreviatura` | `etc` |
| `#Url` | — | `www.example.com` |
| `#PhoneNumber` | `#Telefone` | `555-123-4567` |
| `#HashTag` | — | `#nlp` |
| `#AtMention` | `#Menção` | `@spencer` |
| `#Emoji` | — | `😀` * |
| `#Emoticon` | — | `:-)` * |
| `#Email` | — | `info@example.com` |
| `#Acronym` | `#Acrônimo` | `ONU` |
| `#Condition` | `#Condição` | `se` * |
