// Yksinkertainen stemmaus-funktio. Noudattaa Suomen kielen perusperiaatteita.
function stemFinnishWord(word) {
  if (word.endsWith('ssa') || word.endsWith('ssä')) {
    return word.slice(0, -3);
  } else if (word.endsWith('lla') || word.endsWith('llä')) {
    return word.slice(0, -3);
  } else if (word.endsWith('lta') || word.endsWith('ltä')) {
    return word.slice(0, -3);
  } else if (word.endsWith('kaan') || word.endsWith('kään')) {
    return word.slice(0, -4);
  } else if (word.endsWith('han') || word.endsWith('hän')) {
    return word.slice(0, -3);
  } else if (word.endsWith('den') || word.endsWith('dän')) {
    return word.slice(0, -3);
  } else if (word.endsWith('tten') || word.endsWith('ttän')) {
    return word.slice(0, -4);
  } else if (word.endsWith('n')) {
    return word.slice(0, -1);
  }
  return word;
}
