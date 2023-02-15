import toText from './toText.js'
import toTextOrdinal from './toOrdinal.js'


const formatNumber = function (parsed, fmt) {
  if (fmt === 'TextOrdinal') {
    let words = toText(parsed.num)
    return toTextOrdinal(words)
  }
  if (fmt === 'TextCardinal') {
    return toText(parsed.num).join('')
  }
  // numeric format - 107 -> '107°'
  if (fmt === 'Ordinal') {
    return String(parsed.num) + '°'
  }
  if (fmt === 'Cardinal') {
    return String(parsed.num)
  }
  return String(parsed.num || '')
}
export default formatNumber