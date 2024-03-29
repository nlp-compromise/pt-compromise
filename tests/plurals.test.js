import test from 'tape'
import nlp from './_lib.js'
const here = '[plurals] '

let arr = [
  ['mesa', 'mesas'],
  ['pai', 'pais'],
  ['flor', 'flores'],
  // ['líquene', 'líquenes'],
  // ['país', 'países'],
  ['raíz', 'raízes'],
  ['mão', 'mãos'],
  ['cão', 'cães'],
  ['leão', 'leões'],
  ['homem', 'homens'],
  ['tom', 'tons'],
  ['casal', 'casais'],
  ['boi', 'bois'],
  ['paul', 'pauis'],
  ['anel', 'anéis'],
  ['farol', 'faróis'],
  ['funil', 'funis'],
  ['barril', 'barris'],
  ['réptil', 'répteis'],
  ['fóssil', 'fósseis'],
  // ['gas', 'gases'],
  // ['francês', 'franceses'],
  ['lápis', 'lápis'],
  ['pires', 'pires'],
  ['pírex', 'pírex'],
  ['inox', 'inox'],
  ['mesa', 'mesas'],
  ['pai', 'pais'],
  ['flor', 'flores'],
  ['raíz', 'raízes'],
  ['mão', 'mãos'],
  ['cão', 'cães'],
  ['leão', 'leões'],
  ['homem', 'homens'],
  ['tom', 'tons'],
  ['casal', 'casais'],
  ['boi', 'bois'],
  ['paul', 'pauis'],
  ['anel', 'anéis'],
  ['farol', 'faróis'],
  ['funil', 'funis'],
  ['barril', 'barris'],
  ['réptil', 'répteis'],
  ['fóssil', 'fósseis'],
  // ['gas', 'gases'],
  ['lápis', 'lápis'],
  ['pires', 'pires'],
  ['pírex', 'pírex'],
  ['inox', 'inox'],
  ['hífen', 'hífenes'],
  ['feliz', 'felizes'],
  ['leão', 'leões'],
  ['avião', 'aviões'],
  ['mão', 'mãos'],
  ['irmão', 'irmãos'],
  ['cão', 'cães'],
  ['pão', 'pães'],
  ['carro', 'carros'],
  ['casa', 'casas'],
  ['homem', 'homens'],
  ['nuvem', 'nuvens'],
  ['álbum', 'álbuns'],
  ['plural', 'plurais'],
  ['animal', 'animais'],
  ['papel', 'papéis'],
  ['farol', 'faróis'],
  ['cabelo', 'cabelos'],
  ['perna', 'pernas'],
  ['maçã', 'maçãs'],
  ['dente', 'dentes'],
  ['rei', 'reis'],
  ['pau', 'paus'],
  // ['líquen', 'líquenes'],
  ['cantor', 'cantores'],
  // ['gás', 'gases'],
  ['raíz', 'raízes'],
  ['viagem', 'viagens'],
  ['ordem', 'ordens'],
  ['jovem', 'jovens'],
  ['divisão', 'divisões'],
  ['razão', 'razões'],
  ['coração', 'corações'],
  ['pão', 'pães'],
  ['mão', 'mãos'],
  ['animal', 'animais'],
  ['automóvel', 'automóveis'],
  ['rouxinol', 'rouxinóis'],
  ['azul', 'azuis'],
  ['imbecil', 'imbecis'],
  ['portátil', 'portáteis'],
  ['lápis', 'lápis'],
  ['cais', 'cais'],
  ['amiga', 'amigas'],
  ['bolo', 'bolos'],
  ['troféu', 'troféus'],
  ['degrau', 'degraus'],
  ['mulher', 'mulheres'],
  ['hambúrguer', 'hambúrgueres'],
  ['açúcar', 'açúcares'],
  ['mar', 'mares'],
  ['bar', 'bares'],
  // ['raiz', 'raízes'],
  ['gravidez', 'gravidezes'],
  ['avestruz', 'avestruzes'],
  ['rapaz', 'rapazes'],

  // ['revés', 'reveses'],
  // ['freguês', 'fregueses'],
  ['lápis', 'lápis'],
  ['atlas', 'atlas'],
  ['pires', 'pires'],
  ['ônibus', 'ônibus'],
  ['vírus', 'vírus'],
  ['opinião', 'opiniões'],
  ['coração', 'corações'],
  ['eleição', 'eleições'],
  ['órfão', 'órfãos'],
  ['sótão', 'sótãos'],
  ['órgão', 'órgãos'],
  ['cidadão', 'cidadãos'],
  ['irmão', 'irmãos'],
  ['cristão', 'cristãos'],
  ['pão', 'pães'],
  ['capitão', 'capitães'],
  ['alemão', 'alemães'],
  ['charlatão', 'charlatães'],
  ['varal', 'varais'],
  ['aluguel', 'aluguéis'],
  ['lençol', 'lençóis'],
  ['paul', 'pauis'],
  ['canil', 'canis'],
  ['fuzil', 'fuzis'],
  ['refil', 'refis'],
  ['fóssil', 'fósseis'],
  ['míssil', 'mísseis'],
  ['réptil', 'répteis'],
  ['garagem', 'garagens'],
  ['jardim', 'jardins'],
  ['bombom', 'bombons'],
  ['tórax', 'tórax'],
  ['látex', 'látex'],
  ['ônix', 'ônix'],
  ['ovo', 'ovos'],
  ['torto', 'tortos'],
  ['jogo', 'jogos'],
  ['porco', 'porcos'],
  ['esposo', 'esposos'],
  ['bolso', 'bolsos'],
  ['almoço', 'almoços'],
  ['acordo', 'acordos'],
  ['caráter', 'carateres'],
  // ['júnior', 'juniores'],
  // ['sênior', 'seniores'],
  ['carro', 'carros'],
  ['fogo', 'fogos'],
  ['coração', 'corações'],
  ['cidadão', 'cidadãos'],
  ['grão', 'grãos'],
  ['mão', 'mãos'],
  ['pão', 'pães'],
  ['varal', 'varais'],
  ['pastel', 'pastéis'],
  ['impossível', 'impossíveis'],
  ['anzol', 'anzóis'],
  ['amor', 'amores'],
  ['avestruz', 'avestruzes'],
  ['lápis', 'lápis'],
  // ['português', 'portugueses'],
  ['coragem', 'coragens'],
  ['bem', 'bens'],
  ['tórax', 'tórax'],
  ['casa', 'casas'],//	house	
  ['pé', 'pés'],//	foot	
  ['açaí', 'açaís'],//	açaí	
  ['corpo', 'corpos'],//	body	
  ['réu', 'réus'],//	defendant	
  ['professor', 'professores'],//	teacher	
  ['ator', 'atores'],//	actor	
  ['cantor', 'cantores'],//	singer	
  ['sabor', 'sabores'],//	taste / flavor	tastes / 
  ['amor', 'amores'],//	love	
  ['gravidez', 'gravidezes'],//	pregnancy	
  // ['raiz', 'raízes'],//	root	
  ['matriz', 'matrizes'],//	headquarter	
  ['rapaz', 'rapazes'],//	boy	
  ['nariz', 'narizes'],//	nose	
  ['homem', 'homens'],//	man	
  ['garçom', 'garçons'],//	waiter	
  ['trem', 'trens'],//	train	
  ['imagem', 'imagens'],//	image	
  ['garagem', 'garagens'],//	garage	
  ['animal', 'animais'],//	animal	
  ['fiel', 'fieis'],//	loyal	
  ['barril', 'barris'],//	barrel	
  ['farol', 'faróis'],//	lighthouse	
  ['azul', 'azuis'],//	blue	
  ['réptil', 'répteis'],//	repitile	
  ['fértil', 'férteis'],//	fertile	
  ['têxtil', 'têxteis'],//	textile	
  ['ônibus', 'ônibus'],//	bus	
  ['lápis', 'lápis'],//	pencil	
  ['bônus', 'bônus'],//	bonus	
  // ['francês', 'franceses'],//	french	
  // ['camponês', 'camponeses'],//	peasant	
  // ['norueguês', 'noruegueses'],//	norwegian	
  // ['inglês', 'ingleses'],//	english	
  // ['freguês', 'fregueses'],//	customer	
  // ['mês', 'meses'],//	month	
  ['latex', 'latex'],//	latex	
  ['xérox', 'xérox'],//	xérox	
  ['pirex', 'pirex'],//	pirex	
  ['pão', 'pães'],//	bread	
  ['alemão', 'alemães'],//	german	
  ['capitão', 'capitães'],//	captain	
  ['órgão', 'órgãos'],//	organ	
  ['irmão', 'irmãos'],//	brother	
  ['cidadão', 'cidadãos'],//	citizen	
  ['estação', 'estações'],//	station	
  ['limão', 'limões'],//	lemon	
  ['razão', 'razões'],//	reason	
  ['viagenzinha', 'viagenzinhas'],//	little trip	little 
  ['irmãozinho', 'irmãozinhos'],//	little brother	little 
  ['mãezinha', 'mãezinhas'],//	dear mother	dear 
  ['cidadezinha', 'cidadezinhas'],//	little city	little 
  ['aguardente', 'aguardentes'],//	spirit	
  ['aeromoço', 'aeromoços'],//	flight attendant 	flight 
  ['girassol', 'girassóis'],//	sunflower	
  // ['quinta-feira', 'quintas-feiras'],//	thursday	
  // ['gentil-homem', 'gentis-homens'],//	kind man	kind 
  // ['guarda-roupa', 'guarda-roupas'],//	wardrobe	
  // ['guarda-sol', 'guarda-sóis'],//	parasol	
  // ['guarda-chuva', 'guarda-chuvas'],//	umbrella	

  ["horário", "horários"],
  ["especialista", "especialistas"],
  ["senador", "senadores"],
  ["segredo", "segredos"],
  ["estrutura", "estruturas"],
  ["serviço", "serviços"],
  ["vela", "velas"],
  ["sacrifício", "sacrifícios"],
  ["sessão", "sessões"],
  ["cena", "cenas"],
  ["estátua", "estátuas"],
  ["solução", "soluções"],
  ["mesa", "mesas"],
  ["conto", "contos"],
  ["talento", "talentos"],
  ["torneira", "torneiras"],
  ["fita", "fitas"],
  ["alvo", "alvos"],
  ["tarefa", "tarefas"],
  ["gosto", "gostos"],
  ["tatuagem", "tatuagens"],
  ["contribuinte", "contribuintes"],
  ["lágrima", "lágrimas"],
  ["lágrima", "lágrimas"],
  ["tecnologia", "tecnologias"],
  ["modelo", "modelos"],
  ["rescisão", "rescisões"],
  ["tema", "temas"],
  ["teoria", "teorias"],
  ["terapia", "terapias"],
  ["coisa", "coisas"],
  ["pensamento", "pensamentos"],
  ["mil", "milhares"],
  ["ameaça", "ameaças"],
  ["limiar", "limiares"],
  ["tempestade", "tempestades"],
  ["pneu", "pneus"],
  ["título", "títulos"],
  ["tabaco", "tabacos"],
  ["tomate", "tomates"],
  ["amanhã", "amanhãs"],
  ["tonelada", "toneladas"],
  ["noite", "noites"],
  ["ferramenta", "ferramentas"],
  ["dente", "dentes"],
  ["topo", "topos"],
  ["tocha", "tochas"],
  ["tornado", "tornados"],
  ["toalha", "toalhas"],
  ["torre", "torres"],
  ["cidade", "cidades"],
  ["toxicidade", "toxicidades"],
  ["toxina", "toxinas"],
  ["brinquedo", "brinquedos"],
  ["comerciante", "comerciantes"],
  ["trilha", "trilhas"],
  ["traço", "traços"],
  ["transferência", "transferências"],
  ["transparência", "transparências"],
  ["armadilha", "armadilhas"],
  ["viagem", "viagens"],
  ["tesouro", "tesouros"],
  ["tratado", "tratados"],
  ["árvore", "árvores"],
  ["truque", "truques"],
  ["viagem", "viagens"],
  ["troll", "trolls"],
  ["camião", "caminhões"],
  ["verdade", "verdades"],
  ["tentativa", "tentativas"],
  ["tubo", "tubos"],
  ["mensalidade", "mensalidades"],
  ["gêmeo", "gêmeos"],
  ["tipo", "tipos"],
  ["conversa", "conversas"],
  ["termo", "termos"],
  ["toque", "toques"],
  ["tática", "táticas"],
  ["tradição", "tradições"],
  ["incerteza", "incertezas"],
  ["desemprego", "desempregados"],
  ["unidade", "unidades"],
  ["atualização", "atualizações"],
  ["urna", "urnas"],
  ["uso", "usos"],
  ["usuário", "usuários"],
  ["utensílio", "utensílios"],
  ["utilidade", "utilitários"],
  ["atualização", "atualizações"],
  ["vacina", "vacinas"],
  ["variedade", "variedades"],
  ["vegetal", "vegetais"],
  ["veículo", "veículos"],
  ["veia", "veias"],
  ["visitante", "visitantes"],
  ["voz", "vozes"],
  ["voluntário", "voluntários"],
  ["eleitor", "eleitores"],
  ["votação", "votações"],
  ["viagem", "viagens"],
  ["violação", "violações"],
  ["visita", "visitas"],
  ["versão", "versões"],
  ["vítima", "vítimas"],
  // ["local", "locais"],
  ["volume", "volumes"],
  ["verso", "versos"],
  ["vulcão", "vulcões"],
  ["virtude", "virtudes"],
  ["violino", "violinos"],
  ["visão", "visões"],
  ["waffle", "waffles"],
  ["salário", "salários"],
  ["parede", "paredes"],
  ["guerra", "guerras"],
  ["armazém", "armazéns"],
  ["aviso", "avisos"],
  ["relógio", "relógios"],
  ["água", "água"],
  ["onda", "ondas"],
  ["caminho", "caminhos"],
  ["fraqueza", "fraquezas"],
  ["arma", "armas"],
  ["casamento", "casamentos"],
  ["semana", "semanas"],
  ["peso", "pesos"],
  ["poço", "poços"],
  ["baleia", "baleias"],
  ["trigo", "trigos"],
  ["roda", "rodas"],
]

test('noun-inflection:', function (t) {
  arr.forEach(a => {
    let [sing, plur] = a
    let str = nlp(sing).tag('Noun').nouns().toPlural().text()
    t.equal(str, plur, here + 'toPlural: ' + sing)

    str = nlp(plur).tag('Plural').nouns().toSingular().text()
    t.equal(str, sing, here + 'toSingular: ' + sing)
  })
  t.end()
})
export default arr