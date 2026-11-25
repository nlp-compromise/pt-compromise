const postTagger = function (doc) {
  // ('oitenta e três', 'um milhão' and 'menos noventa' are done in ./numbers.js)
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
  // 'a verdade era..', 'eu o vi' are in article-clitic.js

  // 'preciso que..', 'eu preciso de ajuda' - verb-use of 'preciso'
  // but not 'o trabalho preciso', where it stays an adjective
  doc.match('^[preciso] (que|de|#Infinitive)', 0).tag('Verb', 'preciso-verb')
  doc.match('(#Pronoun|#Negative|#Adverb) [preciso] (que|de|#Infinitive)', 0).tag('Verb', 'pron-preciso-verb')

  // ==subjunctive context==
  // 'espero que fale', 'talvez ele venha', 'que você não fale'
  doc.match('(que|talvez|embora) (#Pronoun|#Negative)? (#Pronoun|#Negative)? [#Imperative]', 0).tag('Subjunctive', 'que-subjunctive')

  // 'se eu fosse' - conditional-if, not the reflexive pronoun
  doc.match('[se] (eu|tu|ele|ela|nós|vós|você|vocês|eles|elas)', 0).tag('Conjunction', 'se-if')


  // ==compound tenses==
  // 'tenho falado' - present perfect
  doc.match('[(tenho|tens|tem|temos|tendes|têm)] #Adverb? #PastParticiple', 0).tag('Auxiliary', 'ter-participle')
  doc.match('(tenho|tens|tem|temos|tendes|têm) #Adverb? [#PastParticiple]', 0).tag('PerfectTense', 'present-perfect')
  // 'tinha falado', 'havia falado' - pluperfect
  doc.match('[(tinha|tinhas|tínhamos|tínheis|tinham|havia|havias|havíamos|havíeis|haviam)] #Adverb? #PastParticiple', 0).tag('Auxiliary', 'tinha-participle')
  doc.match('(tinha|tinhas|tínhamos|tínheis|tinham|havia|havias|havíamos|havíeis|haviam) #Adverb? [#PastParticiple]', 0).tag('Pluperfect', 'pluperfect-compound')
  // 'terá falado', 'teria falado', 'tenha falado' - other perfect forms
  doc.match('[(terei|terás|terá|teremos|tereis|terão|teria|terias|teríamos|teríeis|teriam|tenha|tenhas|tenhamos|tenham|tivesse|tivesses|tivéssemos|tivessem|tiver|tiveres|tivermos|tiverem)] #Adverb? #PastParticiple', 0).tag('Auxiliary', 'ter-fut-participle')
  doc.match('(terei|terás|terá|teremos|tereis|terão|teria|terias|teríamos|teríeis|teriam|tenha|tenhas|tenhamos|tenham|tivesse|tivesses|tivéssemos|tivessem|tiver|tiveres|tivermos|tiverem) #Adverb? [#PastParticiple]', 0).tag('PerfectTense', 'other-perfect')

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

  // ==misc==
  // four vs room
  doc.match('#Determiner [quarto]', 0).tag('Noun', 'quatro-room')
  doc.match('#Determiner [quartos]', 0).tag('Plural', 'quatro-room')
}
export default postTagger