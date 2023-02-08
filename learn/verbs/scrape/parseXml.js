import fs from 'fs'
import XmlStream from 'xml-stream'

let file = '/Users/spencer/mountain/pt-compromise/learn/verbs/conjugations-pt.xml'
const stream = fs.createReadStream(file)
const xml = new XmlStream(stream)

xml.collect('p')
xml.on('endElement pretérito-imperfeito', function (s) {
  console.log(s)
  console.log('---')
})

xml.on('end', function (x, data) {
  console.log(data)
  console.log('end')
})
