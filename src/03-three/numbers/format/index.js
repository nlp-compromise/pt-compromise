import { europeanNumbers } from 'compromise/shared'
import { toText, toTextOrdinal } from './toText.js'

const { write } = europeanNumbers.methods.two.europeanNumbers

// returns null when a number can't be written this way
const formatNumber = function (parsed, fmt) {
  const num = parsed.num
  if (fmt === 'TextOrdinal' || fmt === 'TextCardinal') {
    const words = fmt === 'TextOrdinal' ? toTextOrdinal(num, parsed) : toText(num, parsed)
    return words ? words.join(' ') : null
  }
  // numeric formats
  if (fmt === 'Ordinal') {
    if (!Number.isInteger(num) || num < 1) {
      return null
    }
    // '1.º', '1ª' and '1o' keep their ending
    return String(num) + (parsed.ordinal || (parsed.isFemale ? 'ª' : 'º'))
  }
  // digits go back the way they were found - '1.234,5', '5,3€'
  return write(num, parsed)
}
export default formatNumber
