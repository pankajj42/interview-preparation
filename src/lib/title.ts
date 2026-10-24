// Display titles for the Crack-the-Coding-Interview sheet, which only contains LeetCode URLs.
// The original URL is always shown/linked next to the derived title; nothing is stored under the derived title.
const ACRONYM: Record<string, string> = {
  bst: 'BST', bsts: 'BSTs', lru: 'LRU', lfu: 'LFU', xor: 'XOR', dna: 'DNA', gcd: 'GCD', gcds: 'GCDs', html: 'HTML', ip: 'IP',
  ascii: 'ASCII', k: 'K', n: 'N', m: 'M', x: 'X', y: 'Y', ii: 'II', iii: 'III', iv: 'IV', vi: 'VI', vii: 'VII', viii: 'VIII', ix: 'IX',
  o1: 'O(1)', '1d': '1D', '2d': '2D', '3d': '3D', '3sum': '3Sum', '4sum': '4Sum',
};
const SMALL = new Set(['a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'and', 'or', 'by', 'as', 'vs']);
const OVERRIDE: Record<string, string> = { sqrtx: 'Sqrt(x)', 'powx-n': 'Pow(x, n)' };
const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

export function deriveTitle(slug: string): string {
  if (OVERRIDE[slug]) return OVERRIDE[slug];
  const t = slug.split('-');
  const out: string[] = [];
  for (let i = 0; i < t.length; i++) {
    const w = t[i];
    if (w === 's' && out.length) { out[out.length - 1] += "'s"; continue; }
    if (w === 'k' && t[i + 1] === 'th') { out.push('K-th'); i++; continue; }
    if (w === 'v' && i < t.length - 1) { out.push('V'); continue; }
    if (ACRONYM[w]) { out.push(ACRONYM[w]); continue; }
    if (w.length === 1 && /[a-z]/.test(w) && w !== 'a') { out.push(w.toUpperCase()); continue; }
    if (SMALL.has(w) && i !== 0 && i !== t.length - 1) { out.push(w); continue; }
    out.push(cap(w));
  }
  return out.join(' ');
}
