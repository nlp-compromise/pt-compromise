// an audit of common nouns, in every plural class - used by noun-audit.test.js, and tests/_hmm/noun-audit.hmm.js
// gender | singular / plural
//  - '*' means the tagger does not see this noun after its article, yet - these are tested in tests/_hmm
const list = `
m o livro / os livros
m o gato / os gatos
m o cachorro / os cachorros
m o menino / os meninos
m o amigo / os amigos
m o filho / os filhos
m o tio / os tios
m o primo / os primos
m o vizinho / os vizinhos
m o médico / os médicos
m o aluno / os alunos
m o ano / os anos
m o século / os séculos
m o minuto / os minutos
m *o segundo / *os segundos
m o momento / os momentos
m o mundo / os mundos
m o bairro / os bairros
m o campo / os campos
m o rio / os rios
m o vento / os ventos
m o caminho / os caminhos
m o prédio / os prédios
m o edifício / os edifícios
m o quarto / os quartos
m o banheiro / os banheiros
m o teto / os tetos
m o muro / os muros
m o banco / os bancos
m o mercado / os mercados
m o teatro / os teatros
m o colégio / os colégios
m o trabalho / os trabalhos
m o caderno / os cadernos
m o prato / os pratos
m o copo / os copos
m o garfo / os garfos
m o queijo / os queijos
m o vinho / os vinhos
m o sapato / os sapatos
m o vestido / os vestidos
m o carro / os carros
m o barco / os barcos
m o braço / os braços
m o dedo / os dedos
m o cabelo / os cabelos
m o dinheiro / os dinheiros
m o preço / os preços
m o número / os números
m o texto / os textos
m o erro / os erros
m o sonho / os sonhos
m o medo / os medos
m o gosto / os gostos
m o lado / os lados
m o centro / os centros
m o grupo / os grupos
m o tipo / os tipos
m o caso / os casos
m o ponto / os pontos
m o passo / os passos
m o espaço / os espaços
m o tempo / os tempos
m o vídeo / os vídeos
m o rádio / os rádios
m o piano / os pianos
m o ovo / os ovos
m o olho / os olhos
m o osso / os ossos
m o porco / os porcos
m o fogo / os fogos
m o jogo / os jogos
m o povo / os povos
m o corpo / os corpos
m o porto / os portos
m o posto / os postos
m o tijolo / os tijolos
m o esforço / os esforços
m o imposto / os impostos
m o forno / os fornos
m o corvo / os corvos
m o poço / os poços
f a casa / as casas
f a mesa / as mesas
f a cadeira / as cadeiras
f a porta / as portas
f a janela / as janelas
f a rua / as ruas
f a escola / as escolas
f a igreja / as igrejas
f a loja / as lojas
f a praia / as praias
f a água / as águas
f a terra / as terras
f a lua / as luas
f a estrela / as estrelas
f a pedra / as pedras
f a folha / as folhas
f a planta / as plantas
f a fruta / as frutas
f a laranja / as laranjas
f a banana / as bananas
f a comida / as comidas
f a cozinha / as cozinhas
f a sala / as salas
f a cama / as camas
f a roupa / as roupas
f a camisa / as camisas
f a saia / as saias
f a bolsa / as bolsas
f a caixa / as caixas
f a carta / as cartas
f a palavra / as palavras
f a língua / as línguas
f a história / as histórias
f a música / as músicas
f a festa / as festas
f a vida / as vidas
f a pessoa / as pessoas
f a criança / as crianças
f a menina / as meninas
f a amiga / as amigas
f a filha / as filhas
f a tia / as tias
f a família / as famílias
f a semana / as semanas
f a hora / as horas
f a cabeça / as cabeças
f a boca / as bocas
f a perna / as pernas
f a ideia / as ideias
f a pergunta / as perguntas
f a resposta / as respostas
f a coisa / as coisas
f a forma / as formas
f a conta / as contas
f a empresa / as empresas
f a fábrica / as fábricas
f a máquina / as máquinas
f a garrafa / as garrafas
f a faca / as facas
f a xícara / as xícaras
f a pizza / as pizzas
m o nome / os nomes
f a classe / as classes
f a ponte / as pontes
f a noite / as noites
f a tarde / as tardes
m o leite / os leites
m o dente / os dentes
m o peixe / os peixes
f a carne / as carnes
f *a gente / as gentes
f a parte / as partes
f a sorte / as sortes
f a morte / as mortes
f a mente / as mentes
f a fonte / as fontes
f a frente / as frentes
f a base / as bases
f a crise / as crises
f a fase / as fases
f a frase / as frases
f a chave / as chaves
f a nave / as naves
f a neve / as neves
f a sede / as sedes
f a rede / as redes
f a parede / as paredes
f a cidade / as cidades
f a verdade / as verdades
f a idade / as idades
f a universidade / as universidades
f a liberdade / as liberdades
m o filme / os filmes
m o clube / os clubes
m o time / os times
m o restaurante / os restaurantes
m o presidente / os presidentes
m o elefante / os elefantes
m o tigre / os tigres
m o monte / os montes
m o vale / os vales
m o bosque / os bosques
m o parque / os parques
m o pente / os pentes
m o tapete / os tapetes
m o bilhete / os bilhetes
m o sabonete / os sabonetes
m o telefone / os telefones
m o uniforme / os uniformes
m o perfume / os perfumes
m o costume / os costumes
m o legume / os legumes
m o chefe / os chefes
m o sanduíche / os sanduíches
m o uísque / os uísques
m o iogurte / os iogurtes
m o site / os sites
m o software / os softwares
m o mouse / os mouses
m o café / os cafés
m o chá / os chás
m o pé / os pés
m o sofá / os sofás
f a avó / as avós
m o avô / os avôs
m o nó / os nós
f a pá / as pás
m o jacaré / os jacarés
m o bebê / os bebês
m o purê / os purês
m o robô / os robôs
m o metrô / os metrôs
m o tatu / os tatus
m o urubu / os urubus
m o peru / os perus
m o caju / os cajus
m o bambu / os bambus
m o menu / os menus
m o xampu / os xampus
m o rubi / os rubis
m o javali / os javalis
m o abacaxi / os abacaxis
m o táxi / os táxis
m o júri / os júris
m o biquíni / os biquínis
f a maçã / as maçãs
f a irmã / as irmãs
f a manhã / as manhãs
f a lã / as lãs
f a rã / as rãs
m o fã / os fãs
m o pai / os pais
f a mãe / as mães
m o rei / os reis
f a lei / as leis
m o boi / os bois
m o herói / os heróis
m o céu / os céus
m o chapéu / os chapéus
m o véu / os véus
m o troféu / os troféus
m o museu / os museus
m o pneu / os pneus
m o grau / os graus
m o pau / os paus
m o degrau / os degraus
m o bacalhau / os bacalhaus
f a mulher / as mulheres
f a flor / as flores
m o mar / os mares
m o lugar / os lugares
m o amor / os amores
f a cor / as cores
f a dor / as dores
m o professor / os professores
m o doutor / os doutores
m *o senhor / *os senhores
m o ator / os atores
m o cantor / os cantores
m o escritor / os escritores
m o diretor / os diretores
m o jogador / os jogadores
m o trabalhador / os trabalhadores
m o computador / os computadores
m o motor / os motores
m o valor / os valores
m o calor / os calores
m o sabor / os sabores
m o favor / os favores
f *a colher / as colheres
m o bar / os bares
m o lar / os lares
m o par / os pares
m o altar / os altares
m o andar / os andares
m o celular / os celulares
m o hambúrguer / os hambúrgueres
m o repórter / os repórteres
m o líder / os líderes
m o açúcar / os açúcares
m o caráter / os caracteres
m o júnior / os juniores
m o revólver / os revólveres
m o dólar / os dólares
m o radar / os radares
m o poder / os poderes
m o dever / os deveres
m o prazer / os prazeres
m o olhar / os olhares
m o jantar / os jantares
m o pôster / os pôsteres
m o zíper / os zíperes
m o suéter / os suéteres
m o contêiner / os contêineres
f a luz / as luzes
f a voz / as vozes
f a vez / as vezes
f a paz / as pazes
m o rapaz / os rapazes
m o nariz / os narizes
f a raiz / as raízes
m o juiz / os juízes
f a cruz / as cruzes
f a noz / as nozes
m o giz / os gizes
m o arroz / os arrozes
m o capuz / os capuzes
m o cartaz / os cartazes
f a atriz / as atrizes
m o xadrez / os xadrezes
m o avestruz / os avestruzes
f a cicatriz / as cicatrizes
f a matriz / as matrizes
f a perdiz / as perdizes
m o verniz / os vernizes
m o aprendiz / os aprendizes
m o chafariz / os chafarizes
m o país / os países
m o mês / os meses
m o português / os portugueses
m o inglês / os ingleses
m o francês / os franceses
m o japonês / os japoneses
m o chinês / os chineses
m o holandês / os holandeses
m o freguês / os fregueses
m o camponês / os camponeses
m o marquês / os marqueses
m o burguês / os burgueses
m o gás / os gases
m o ás / os ases
m o deus / os deuses
m o ananás / os ananases
m o revés / os reveses
m o convés / os conveses
m o viés / os vieses
f a rês / as reses
m o obus / os obuses
m o adeus / os adeuses
m o retrós / os retroses
m o homem / os homens
m o jardim / os jardins
f a viagem / as viagens
m o som / os sons
m o álbum / os álbuns
f a nuvem / as nuvens
m o jovem / os jovens
f a ordem / as ordens
f a imagem / as imagens
f a mensagem / as mensagens
f a garagem / as garagens
f a paisagem / as paisagens
f a passagem / as passagens
f a origem / as origens
f a margem / as margens
m o bem / os bens
m o trem / os trens
m o armazém / os armazéns
m o refém / os reféns
m o vintém / os vinténs
m o fim / os fins
m o capim / os capins
m o amendoim / os amendoins
m o pudim / os pudins
m o jasmim / os jasmins
m o boletim / os boletins
m o motim / os motins
m o patim / os patins
m o tom / os tons
m o dom / os dons
m o bombom / os bombons
m o batom / os batons
m o garçom / os garçons
m o atum / os atuns
m o jejum / os jejuns
m o fórum / os fóruns
m o item / os itens
m o totem / os totens
m o animal / os animais
m o hospital / os hospitais
m o jornal / os jornais
m o canal / os canais
m o sinal / os sinais
f a capital / as capitais
m o final / os finais
m o general / os generais
m o quintal / os quintais
m o casal / os casais
m o metal / os metais
m o local / os locais
m o total / os totais
m o ideal / os ideais
m o mineral / os minerais
m o tribunal / os tribunais
m o festival / os festivais
m o carnaval / os carnavais
m o real / os reais
m o sal / os sais
m o pardal / os pardais
m o litoral / os litorais
m o portal / os portais
m o cristal / os cristais
m o material / os materiais
m o oficial / os oficiais
m o vegetal / os vegetais
m o pedal / os pedais
m o mal / os males
m o papel / os papéis
m o hotel / os hotéis
m o anel / os anéis
m o pastel / os pastéis
m o quartel / os quartéis
m o pincel / os pincéis
m o carretel / os carretéis
m o coronel / os coronéis
m o aluguel / os aluguéis
m o painel / os painéis
m o cartel / os cartéis
m o túnel / os túneis
m o nível / os níveis
m o móvel / os móveis
m o automóvel / os automóveis
m o imóvel / os imóveis
m o lençol / os lençóis
m o sol / os sóis
m o farol / os faróis
m o anzol / os anzóis
m o caracol / os caracóis
m o girassol / os girassóis
m o espanhol / os espanhóis
m o rouxinol / os rouxinóis
m o paiol / os paióis
m o cachecol / os cachecóis
m o álcool / os álcoois
m o azul / os azuis
m o paul / os pauis
m o cônsul / os cônsules
m o barril / os barris
m o funil / os funis
m o fuzil / os fuzis
m o canil / os canis
m o perfil / os perfis
m o quadril / os quadris
m o covil / os covis
m o fóssil / os fósseis
m o réptil / os répteis
m o projétil / os projéteis
m o míssil / os mísseis
f a lição / as lições
m o coração / os corações
f a nação / as nações
m o avião / os aviões
f a canção / as canções
f a estação / as estações
f a televisão / as televisões
f a opinião / as opiniões
f a questão / as questões
f a razão / as razões
f a região / as regiões
f a religião / as religiões
f a reunião / as reuniões
f a decisão / as decisões
f a eleição / as eleições
f a emoção / as emoções
f a função / as funções
f a informação / as informações
f a operação / as operações
f a população / as populações
f a posição / as posições
f a relação / as relações
f a situação / as situações
f a solução / as soluções
f a tradição / as tradições
m o botão / os botões
m o balão / os balões
m o limão / os limões
m o melão / os melões
m o feijão / os feijões
m o leão / os leões
m o ladrão / os ladrões
m o campeão / os campeões
m o caminhão / os caminhões
m o cartão / os cartões
m o portão / os portões
m o salão / os salões
m o violão / os violões
m o fogão / os fogões
m o colchão / os colchões
m o mamão / os mamões
m o pulmão / os pulmões
m o tubarão / os tubarões
m o dragão / os dragões
m o patrão / os patrões
m o peão / os peões
m o espião / os espiões
m *o milhão / *os milhões
m o verão / os verões
m o vulcão / os vulcões
m o gavião / os gaviões
m o pavão / os pavões
m o sabão / os sabões
m o trovão / os trovões
f a ação / as ações
f a visão / as visões
f a mansão / as mansões
f a paixão / as paixões
f a prisão / as prisões
f a missão / as missões
f a versão / as versões
f a sessão / as sessões
f a união / as uniões
m o pão / os pães
m o cão / os cães
m o alemão / os alemães
m o capitão / os capitães
m o escrivão / os escrivães
m o tabelião / os tabeliães
m o capelão / os capelães
m o catalão / os catalães
f a mão / as mãos
m o irmão / os irmãos
m o cidadão / os cidadãos
m o órgão / os órgãos
m o cristão / os cristãos
m o pagão / os pagãos
m o grão / os grãos
m o chão / os chãos
m o vão / os vãos
m o órfão / os órfãos
m o sótão / os sótãos
f a bênção / as bênçãos
m o acórdão / os acórdãos
m o artesão / os artesãos
m o lápis / os lápis
m o ônibus / os ônibus
m o pires / os pires
m o atlas / os atlas
m o vírus / os vírus
m o tênis / os tênis
m o cais / os cais
m o oásis / os oásis
m o bônus / os bônus
f a íris / as íris
f a cútis / as cútis
f a pélvis / as pélvis
m o alferes / os alferes
m o ourives / os ourives
m o bíceps / os bíceps
m o fórceps / os fórceps
m o jeans / os jeans
m o herpes / os herpes
m o húmus / os húmus
m o tórax / os tórax
m o clímax / os clímax
m o látex / os látex
f a fênix / as fênix
m o ônix / os ônix
m o hífen / os hifens
m o pólen / os polens
m o abdômen / os abdomens
m o líquen / os liquens
m o éden / os edens
m o gérmen / os germens
m o cânon / os cânones
m o elétron / os elétrons
m o próton / os prótons
m o nêutron / os nêutrons
m o problema / os problemas
m o dia / os dias
m o mapa / os mapas
m o sistema / os sistemas
m o planeta / os planetas
m o programa / os programas
m o tema / os temas
m o clima / os climas
m o idioma / os idiomas
m o poema / os poemas
m o drama / os dramas
m o cinema / os cinemas
m o telefonema / os telefonemas
m o cometa / os cometas
m o pijama / os pijamas
m o samba / os sambas
m o panda / os pandas
m o gorila / os gorilas
f a foto / as fotos
f a tribo / as tribos
f a moto / as motos
m o gol / os gols
m o shopping / os shoppings
m o show / os shows
m o blog / os blogs
m o link / os links
m o chip / os chips
m o kit / os kits
m o laptop / os laptops
m o tablet / os tablets
m o slogan / os slogans
m o estudante / os estudantes
f a estudante / as estudantes
m o artista / os artistas
f a artista / as artistas
m o colega / os colegas
f a colega / as colegas
f a jovem / as jovens
m o dentista / os dentistas
f a dentista / as dentistas
m o jornalista / os jornalistas
f a jornalista / as jornalistas
m o turista / os turistas
f a turista / as turistas
m o cliente / os clientes
f a cliente / as clientes
m o gerente / os gerentes
m o atleta / os atletas
f a atleta / as atletas
m o motorista / os motoristas
m o pianista / os pianistas
`

// nouns that are only used in the plural
const pluralOnly = ['os óculos', 'as férias', 'as costas', 'os parabéns', 'as núpcias', 'os pêsames', 'os arredores', 'os víveres', 'as fezes', 'as cócegas', 'os anais', 'os afazeres']

// [masculine, feminine] - with their article
const feminine = `
o menino / a menina
o gato / a gata
o aluno / a aluna
o amigo / a amiga
o médico / a médica
o filho / a filha
o tio / a tia
o primo / a prima
o vizinho / a vizinha
o advogado / a advogada
o engenheiro / a engenheira
o sogro / a sogra
o neto / a neta
o namorado / a namorada
o cozinheiro / a cozinheira
o enfermeiro / a enfermeira
o garoto / a garota
o moço / a moça
o lobo / a loba
o pato / a pata
o professor / a professora
o cantor / a cantora
o autor / a autora
o escritor / a escritora
o diretor / a diretora
o pintor / a pintora
o vendedor / a vendedora
o trabalhador / a trabalhadora
o doutor / a doutora
o senhor / a senhora
o ator / a atriz
o imperador / a imperatriz
o embaixador / a embaixatriz
o irmão / a irmã
o campeão / a campeã
o cidadão / a cidadã
o anão / a anã
o alemão / a alemã
o capitão / a capitã
o órfão / a órfã
o leão / a leoa
o patrão / a patroa
o freguês / a freguesa
o camponês / a camponesa
o português / a portuguesa
o inglês / a inglesa
o príncipe / a princesa
o barão / a baronesa
o conde / a condessa
o duque / a duquesa
o poeta / a poetisa
o herói / a heroína
o rei / a rainha
o judeu / a judia
o ateu / a ateia
o europeu / a europeia
o réu / a ré
o avô / a avó
o pai / a mãe
o homem / a mulher
o padrinho / a madrinha
o padrasto / a madrasta
o genro / a nora
o cavalo / a égua
o galo / a galinha
o boi / a vaca
o cão / a cadela
o bode / a cabra
o carneiro / a ovelha
o juiz / a juíza
o deus / a deusa
o frade / a freira
o monge / a monja
o padre / a madre
o compadre / a comadre
o espanhol / a espanhola
o mestre / a mestra
o tigre / a tigresa
o ladrão / a ladra
o estudante / a estudante
o artista / a artista
o colega / a colega
o jovem / a jovem
o dentista / a dentista
o jornalista / a jornalista
o cliente / a cliente
um menino / uma menina
um professor / uma professora
os meninos / as meninas
os professores / as professoras
os alunos / as alunas
os irmãos / as irmãs
os leões / as leoas
os atores / as atrizes
os reis / as rainhas
os portugueses / as portuguesas
os estudantes / as estudantes
uns amigos / umas amigas
`

const parse = (str, gender) => {
  const [, hmm, art, noun] = str.match(/^(\*?)(\S+ )(\S+)$/)
  return { str: art + noun, art, noun, gender, hmm: hmm === '*' }
}
const nouns = list.trim().split('\n').map((line) => {
  const [, g, one, many] = line.match(/^(\S) (.+) \/ (.+)$/)
  return { singular: parse(one, g), plural: parse(many, g) }
})
const toFeminine = feminine.trim().split('\n').map((line) => {
  const [, hmm, male, female] = line.match(/^(\*?)(.+) \/ (.+)$/)
  return { male, female, hmm: hmm === '*' }
})

export { pluralOnly, toFeminine }
export default nouns
