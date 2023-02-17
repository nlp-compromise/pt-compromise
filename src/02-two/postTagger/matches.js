const postTagger = function (doc) {
  // oitenta e três
  doc.match('#Value [e] #Cardinal', 0).tag('Cardinal', 'val-e-val')
  doc.match('#Value [e] #Value', 0).tag('Value', 'val-e-val')

  doc.match('#Value e #Value e #Value').tag('Value', 'val-e-val')
  // vinte e uma
  doc.match('#Value e? (uma|um)').tag('Cardinal', 'val-e-uma')
  // uma milhão
  doc.match('(uma|um) #Value').tag('Value', 'uma-milhão')
  // menos noventa
  doc.match('menos #Value').tag('Value', 'menos-noventa')
  // cantar é bom
  doc.match('[#Infinitive] #Copula', 0).tag('Noun', 'gerund-noun')
  // a o => to the
  doc.match('[a] #Determiner', 0).tag('Preposition', 'to-the')
  // o jantar
  doc.match('o [#Infinitive]', 0).tag('Noun', 'o-verb')

  // ===auxiliary verbs==
  // está a comer
  doc.match('[{estar} a?] #Verb', 0).tag('Auxiliary', 'está-a-verb')
  // ele vai cantar
  doc.match('[{ir}] #Verb', 0).tag('Auxiliary', 'ir-verb')
  // ele havia falado
  doc.match('[{haver}] #Verb', 0).tag('Auxiliary', 'haver-verb')
  // Ele quer mostrar
  doc.match('[{querer}] #Verb', 0).tag('Auxiliary', 'querer-verb')

  // ==reflexive verbs==
  doc.match('#Verb [(me|se|te|nos)]', 0).tag('Reflexive', 'verb-se')
  doc.match('[(me|se|te|nos)] #Verb', 0).tag('Reflexive', 'se-verb')
}
export default postTagger