import test from 'tape'
import nlp from '../../_lib.js'
const here = '[pt-sentence-rules] '

// each line is one text - a '|' marks where one sentence ends, and the next begins
const run = function (t, cases) {
  cases
    .split('\n')
    .map(str => str.trim())
    .filter(str => str)
    .forEach(str => {
      const want = str.split('|').map(s => s.trim())
      const text = want.join(' ')
      t.deepEqual(nlp(text).fullSentences().out('array'), want, here + text)
    })
  t.end()
}

test('abbreviations:', function (t) {
  run(
    t,
    `
    O Sr. Silva chegou. | A Sra. Costa não.
    A Dra. Ana está aqui.
    Falei com a Profa. Ana ontem.
    Mora na Av. Paulista.
    Ver pág. 5 do livro.
    V. Exa. tem razão.
    Ver pág. 5, p. ex. o cap. 3.
    Em 300 a.C. em Roma. | Depois não.
    A Cia. Vale Ltda. fechou.
    Mora na R. Augusta, n.º 5.
    Chegou em 1.º lugar. | Ganhou.
    Comprou pão, leite, etc. | Depois voltou para casa.
    Comprou pão, etc. e leite.
    Chegou em set. de 2020.
    Chegou no dia 3 de mar. de 2020.
    Ele vem na seg. e na qui. à tarde.
    Ele vem na ter. à tarde.
    A Srta. Lima trabalha aqui. | É advogada.
    Os Srs. Pereira não vieram.
    O Dr. Ramos atende de seg. a sex. à tarde.
    O Eng. Sousa e o Arq. Melo assinaram.
    O Exmo. Sr. Presidente falou.
    D. Pedro II governou o Brasil.
    Sto. Antônio nasceu em Lisboa.
    Sta. Catarina é um estado.
    Pe. Antônio Vieira foi escritor.
    Consulte o cap. 3, págs. 40-45.
    Veja a fig. 2 do art. 5.
    O vol. 2 da ed. de 1990 está esgotado.
    Mede aprox. 2 m de altura.
    Ligue para o tel. 5555-1234.
    Aconteceu no séc. XIX na Europa.
    Aconteceu em 500 a.C. na Grécia.
    São 5 p.m. e está frio.
    F. Pessoa nasceu em Lisboa. | Morreu em 1935.
    Obs. o prazo termina amanhã.
    Ref. pedido n.º 123.
    Nasceu em 3 de fev. de 1990 em Recife.
    Flamengo vs. Vasco é amanhã.
    A empresa Silva & Cia. Ltda. faliu.
    Rua Prof. Morais, n.º 12.
    Volto em jan. ou fev. do ano que vem.
    Em nov. e dez. chove muito.
    A reunião é na qua. de manhã.
    O curso vai de ago. a dez. deste ano.
    Chegou em 5 de out. de 2019.
    P.S. te amo.
    N.B. a loja fecha ao domingo.
    Exma. Sra. Dra. Juíza, venho requerer.
    Depto. de Vendas, 2.º andar.
    Pág. 10 do doc. anexo.
    Profs. Lima e Costa deram a aula.
    Ilmo. Sr. Diretor, solicito uma reunião.
    Ele mora na Trav. das Flores.
    O Gen. Osório venceu a batalha.
    O Cel. Fontes e o Cap. Nunes chegaram.
  `
  )
})

test('not abbreviations:', function (t) {
  run(
    t,
    `
    Ele quer ter. | Ela não.
    Eu vi o mar. | Era azul.
    É um dom. | Use-o.
    Ele tem um set. | Joga bem.
    Não sei o que é. | Talvez.
    Vou ao sul. | Ela vai ao norte.
    Tenho sede. | Dá-me água.
    Ele disse que sim. | Eu disse que não.
    Não sei. | Pergunta a ele.
    Faz sol. | Vamos à praia.
    Já vou. | Até logo.
    Ela bebe chá. | Ele bebe café.
    Tem 20 anos. | O irmão tem 25.
    Custa 3,50 euros. | É barato.
    Nasceu em 1990. | Morreu em 2020.
    Chego às 10. | Saio às 12.
    É o fim. | Eu sei.
    Ele é mau. | Ela é boa.
    Gosto de ti. | E tu?
    Vem cá. | Senta aqui.
    Ele mora lá. | Eu moro aqui.
    Quero um pão. | Ela quer dois.
    Isso é bom. | Aquilo é mau.
    Comprei um sofá. | Ficou caro.
    É a lei. | Cumpra-se.
    Vi o rei. | Era alto.
    Que dor. | Chama o médico.
    O céu é azul. | O mar também.
    Ela quer ter. | Ele quer ser.
    Visite www.exemplo.pt para saber mais. | Obrigado.
    O arquivo notas.txt está vazio. | Apague-o.
    A versão 2.0 saiu. | É rápida.
  `
  )
})

test('questions and exclamations:', function (t) {
  run(
    t,
    `
    Como estás? | Eu estou bem.
    Que lindo! | Adoro.
    O quê? | Como? | Quando?
    A sério?! | Não acredito!
    Ah é? disse ele rindo.
    E tu? | Eu não.
    Olá! | Como te chamas?
    Não! | De jeito nenhum!
    Espera… | Já vou.
    Não sei... | Talvez amanhã.
    Não sei... talvez amanhã.
    Bem… veremos. | Tchau!
  `
  )
})

test('quotations and dialogue:', function (t) {
  run(
    t,
    `
    Disse: «Não. Não vou.» | Depois saiu.
    Ele disse: "Não sei." | Depois saiu.
    (Não sei.) | Talvez amanhã.
    — Quem é? — perguntou ele.
    — Vem cá! — gritou ela. | Ele obedeceu.
    Ela disse: “Não posso.” | Ele insistiu.
    Disse-me "olá" e foi embora. | Não voltou.
    Pensou (por um instante) nela. | Depois continuou.
    Disse: «Não. Nunca. Não quero. Chega.» | Depois calou-se.
    «Bom dia.» | Entrou.
    «Acabou», disse ela. | Ele chorou.
    — Não sei — disse ele. | — Talvez amanhã.
    Sussurrou: «Silêncio. Ele dorme.» | Saímos devagar.
  `
  )
})

test('harder cases:', function (t) {
  run(
    t,
    `
    São 5 p.m. | Vamos.
    Trabalha na Petrobras S.A. | Mora no Rio.
    «Sim.» | «Não.»
    Pesa 3 kg. de arroz.
    Pesa 3 kg. | Mede 2 m.
    1. Abra a porta. | 2. Entre.
    O jogo foi no dom. | Foi bom.
    É sex. | Vamos sair.
    Ele saiu em out. | Ela ficou.
    Quem? | Eu?
    Mora na rua A. | Depois vire.
    Foi escrito por J. R. R. Tolkien. | É famoso.
    Fale com o Dr. | Ele sabe.
    Ver pág. 12. | Ver também pág. 15.
    ‘Olá’, disse. | ‘Adeus’, respondeu.
    Correu 5 km. | Depois dormiu.
    Nasceu em fev. | Morreu em dez.
    Aberto de seg. a sex. | Fechado ao domingo.
    Roma, 50 a.C. | César reina.
    Levou tudo, etc. | Não resta nada.
    É o Sr. | Não, é a Sra.
    O meu tel. é 555. | Liga-me.
    Não. | Sim. | Talvez.
    «Não», disse. | «Sim», respondi.
    Disse-me: «Vem». | Fui.
    A criança gritou: «Mãe!». | Ninguém veio.
    Ver fig. 3. | Ver também fig. 4.
    Espera 5 min. em frente à porta.
    Espera 5 min. | Depois parte.
    Vamos! | Rápido! | É tarde.
    Sim? | Não? | Decide.
    Eis o art. 5. | Leia-o.
    Ganha aprox. 2000. | É pouco.
    A Vale Ltda. | Fechou ontem.
    Chegou em 3 de set. | Partiu em 5 de out.
    Ele joga na ter. | Ela na qui.
  `
  )
})

test('longer texts:', function (t) {
  run(
    t,
    `
    Veja a fig. A e a tab. B no anexo.
    Está no vol. II da obra.
    Consulte o cap. IV e o art. XII.
    A Univ. de Coimbra é antiga.
    Saiu pela Ed. Abril em 1990.
    O Dr. Silva e a Dra. Costa chegaram às 17 h ao hospital. | Depois operaram o paciente. | Tudo correu bem.
    A empresa foi fundada em 1950. | Hoje tem aprox. 500 funcionários. | Em 2023 faturou 80 milhões.
    Chegou às 7. | Não havia ninguém. | Então esperou até às 8. | Depois foi-se embora.
    — Que horas são? — perguntou ela. | — São três — disse ele. | Ela assentiu.
    Precisamos de farinha, ovos, açúcar, etc. | Tens tudo?
    Camões nasceu em 1524 em Lisboa. | Morreu em 1580.
    Mede 1,80 m. | Ela mede 1,65 m.
    O pacote pesa 2 kg. | O envio custa 5 euros.
    Que surpresa! | Quando chegaste? | Não te esperava antes de amanhã.
    Fale com o Eng. | Ele ajuda.
    O texto está na pág. 5. | Leia com calma.
    Aberto de seg. a sex. das 8 às 17 h. | Fechado ao domingo.
  `
  )
})
