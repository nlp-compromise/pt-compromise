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
  // Que chato!
  doc.match('^que #Adjective').tag('Expression', 'how-nice')
  // according to
  doc.match('^[segundo] #Noun').tag('Preposition', 'segundo-salles')

  // ==determiner + conjugated-verb is usually a noun==
  // 'uma fala', 'esse bolo', 'a melhor aluna'
  doc.match('(um|uma|uns|umas|este|esta|estes|estas|esse|essa|esses|essas|aquele|aquela|meu|minha|teu|tua|seu|sua|nosso|nossa) #Adjective? [#Verb]', 0)
    .ifNo('(#Copula|#Auxiliary)')
    .tag('Noun', 'det-verb-noun')
  // 'a verdade era..' - but not 'eu o vi', where o|a is a clitic pronoun
  doc.match('^(o|a|os|as) #Adjective? [#Verb]', 0).ifNo('(#Copula|#Auxiliary|#Infinitive)').tag('Noun', 'start-det-verb')
  doc.match('#Preposition (o|a|os|as) #Adjective? [#Verb]', 0).ifNo('(#Copula|#Auxiliary|#Infinitive)').tag('Noun', 'prep-det-verb')
  doc.match('#Verb (o|a|os|as) #Adjective? [#Verb]', 0).ifNo('(#Copula|#Auxiliary|#Infinitive)').tag('Noun', 'verb-det-verb')

  // 'preciso que..', 'eu preciso de ajuda' - verb-use of 'preciso'
  // but not 'o trabalho preciso', where it stays an adjective
  doc.match('^[preciso] (que|de|#Infinitive)', 0).tag('Verb', 'preciso-verb')
  doc.match('(#Pronoun|#Negative|#Adverb) [preciso] (que|de|#Infinitive)', 0).tag('Verb', 'pron-preciso-verb')

  // ==subjunctive context==
  // 'espero que fale', 'talvez ele venha', 'que você não fale'
  doc.match('(que|talvez|embora) (#Pronoun|#Negative)? (#Pronoun|#Negative)? [#Imperative]', 0).tag('Subjunctive', 'que-subjunctive')

  // 'se eu fosse' - conditional-if, not the reflexive pronoun
  doc.match('[se] (eu|tu|ele|ela|nós|vós|você|vocês|eles|elas)', 0).tag('Conjunction', 'se-if')

  // 'começou a chover' - 'a' + infinitive is a preposition
  doc.match('[a] #Infinitive', 0).tag('Preposition', 'a-infinitive')

  // ===auxiliary verbs==
  // está a comer
  doc.match('[{estar} a?] #Verb', 0).tag('Auxiliary', 'está-a-verb')
  // ele vai cantar
  doc.match('[{ir}] #Verb', 0).tag('Auxiliary', 'ir-verb')
  // ele havia falado
  doc.match('[{haver}] #Verb', 0).tag('Auxiliary', 'haver-verb')
  // Ele quer mostrar
  doc.match('[{querer}] #Verb', 0).tag('Auxiliary', 'querer-verb')
  // future tense
  doc.match('[{ser}] #Verb', 0).tag('Auxiliary', 'ser-verb')
  // ==modals==
  doc.match('[{poder}] #Verb', 0).tag('Modal', 'could-verb')
  doc.match('{poder} ter #Noun').tag('#Modal #Auxiliary #Verb', 'could-have-noun')
  doc.match('[{poder} ter] #Verb', 0).tag('#Modal #Auxiliary', 'could-have-verb')
  // must 
  doc.match('[{dever}] #Verb', 0).tag('Modal', 'must-verb')

  // ==reflexive verbs==
  doc.match('#Verb [(me|se|te|nos)]', 0).tag('Reflexive', 'verb-se')
  doc.match('[(me|se|te|nos)] #Verb', 0).tag('Reflexive', 'se-verb')

  // ==numbers==
  doc.match('#Value [(primeiro|primeira|primeiros|primeiras)]', 0).tag('Ordinal', 'val-primeiro')
  // ==misc==
  // four vs room
  doc.match('#Determiner [quarto]', 0).tag('Noun', 'quatro-room')
}
export default postTagger