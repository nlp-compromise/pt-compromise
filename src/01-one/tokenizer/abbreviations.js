// words that end in a period, but don't end a sentence - 'Dr.'
// (these replace the english abbreviations, which collide with real words here)
const toObj = str => Object.fromEntries(str.trim().split(/\s+/).map(w => [w, true]))

export default toObj(`
  sr sra srs sras srta dr dra drs dras prof profa profs eng arq
  exa exmo exma ilmo ilma pe sto sta gen cel cap ten sgt maj
  av cia ltda trav vs depto dep univ ed séc
  pág págs art vol fig tab núm ref ex tel aprox obs doc etc
  kg km cm mm ml min
  seg qua qui sex
  jan fev abr mai jun jul ago set out nov dez
`)
