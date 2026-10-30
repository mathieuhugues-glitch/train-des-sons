/* Le train des sons - « Les paires de lettres » (big/small letter matching): letter sets per level. Also runs in Node. */
(function (root) {
  'use strict';
  const AZ = Array.from('abcdefghijklmnopqrstuvwxyz');
  const ALPHA = { fr: AZ.concat(['é']), sv: AZ.concat(['å', 'ä', 'ö']) };
  // Level 1: letters whose small and big forms look alike
  const ALIKE = Array.from('cosvwxzkpu');
  // Level 3: letters that are easy to confuse, with their look-alikes
  const GROUPS = [['b', 'd', 'p', 'q'], ['n', 'u', 'm', 'h'], ['i', 'l', 'j', 't'], ['a', 'e', 'o'], ['g', 'q', 'p', 'y'], ['h', 'n', 'k'], ['f', 't'], ['v', 'w', 'y'],
    ['å', 'ä', 'a', 'ö', 'o'], ['é', 'e', 'a']];
  const CONF = { fr: Array.from('bdpqnumhiljaegf').concat(['é']), sv: Array.from('bdpqnumhiljaegf').concat(['å', 'ä', 'ö']) };
  const shuffle = (a, r) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function pick(lang, level, used, r) {
    r = r || Math.random; used = used || new Set();
    const alpha = ALPHA[lang], targets = level === 1 ? ALIKE : level === 2 ? AZ : level === 3 ? CONF[lang] : alpha;
    let cands = targets.filter(x => !used.has(x)); if (!cands.length) cands = targets;
    const target = cands[Math.floor(r() * cands.length)];
    const n = level === 1 ? 2 : 3; let out = [];
    if (level === 1) out = shuffle(ALIKE.filter(x => x !== target), r).slice(0, n);
    else {
      if (level >= 3) { const mates = new Set(); GROUPS.forEach(g => { if (g.includes(target)) g.forEach(x => mates.add(x)); });
        out = shuffle(Array.from(mates).filter(x => x !== target && alpha.includes(x)), r).slice(0, n); }
      for (const x of shuffle(alpha.filter(y => y !== target && (level >= 3 || AZ.includes(y))), r)) { if (out.length >= n) break; if (!out.includes(x)) out.push(x); }
    }
    return { target, distractors: out };
  }
  const api = { pick, ALIKE, CONF, ALPHA, GROUPS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TDS_PAIRS = api;
})(this);
