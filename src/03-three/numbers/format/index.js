import { europeanNumbers } from 'compromise/shared'
import toText from './toText.js'
import toTextOrdinal from './toOrdinal.js'


const { write } = europeanNumbers.methods.two.europeanNumbers

const formatNumber = function (parsed, fmt) {
  if (fmt === 'TextOrdinal') {
    const words = toText(parsed.num)
    return toTextOrdinal(words)
  }
  if (fmt === 'TextCardinal') {
    return toText(parsed.num).join(' ')
  }
  // numeric format - 107 -> '107°'
  if (fmt === 'Ordinal') {
    return String(parsed.num) + '°'
  }
  // digits go back the way they were found - '1.234,5', '5,3€'
  // .. but a unit is its own (implicit) term - '9km'
  const suffix = /\p{L}/u.test(parsed.suffix || '') ? '' : parsed.suffix
  return write(parsed.num, { ...parsed, suffix })
}
export default formatNumber