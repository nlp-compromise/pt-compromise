const postTagger = function (doc) {
  // oitenta e três
  doc.match('#Value [e] #Cardinal', 0).tag('Cardinal', 'val-e-val')
  doc.match('#Value [e] #Value', 0).tag('Value', 'val-e-val')

  doc.match('#Value e #Value e #Value').tag('Value', 'val-e-val')
  // vinte e uma
  doc.match('#Value e? (uma|um)').tag('Cardinal', 'val-e-uma')
  // uma milhão
  doc.match('(uma|um) #Value').tag('Value', 'uma-milhão')
}
export default postTagger