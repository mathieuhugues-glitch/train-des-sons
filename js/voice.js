/* Le train des sons - speech (speechSynthesis). Picks the best fr-FR / sv-SE voice available. Fails silently. */
(function () {
  'use strict';
  const NICE = /(enhanced|premium|neural|natural|amélie|amelie|audrey|thomas|marie|aurélie|alva|klara|oskar|google)/i;
  const ODD = /(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley)/i;
  const LOC = { fr: 'fr-fr', sv: 'sv-se' };
  const cache = {};
  function voices() { try { return speechSynthesis.getVoices() || []; } catch (e) { return []; } }
  function best(code) {
    if (cache[code] !== undefined) return cache[code];
    const vs = voices().filter(v => v.lang && v.lang.replace('_', '-').toLowerCase().startsWith(code));
    let top = null, ts = -99;
    for (const v of vs) {
      let s = 0; const l = v.lang.replace('_', '-').toLowerCase();
      if (l === LOC[code]) s += 4; if (NICE.test(v.name)) s += 3; if (ODD.test(v.name)) s -= 6; if (v.localService) s += 1;
      if (s > ts) { ts = s; top = v; }
    }
    if (vs.length) cache[code] = top; // only cache once voices are loaded
    return top;
  }
  try { speechSynthesis.addEventListener('voiceschanged', () => { for (const k in cache) delete cache[k]; }); } catch (e) {}
  // How to pronounce a wagon (keep it simple: letter name, or the sound for French graphemes)
  const G = { fr: { ch: 'che', ou: 'ou', on: 'on', oi: 'oie', an: 'an', en: 'an', in: 'ain', ain: 'ain', eau: 'eau', au: 'au', ai: 'ai', eu: 'eux', ph: 'fe', qu: 'que', gn: 'gne', â: 'a', y: 'i grec' }, sv: {} };
  let lang = 'fr';
  function say(text, rate) {
    if (!text) return;
    try {
      if (!('speechSynthesis' in window)) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === 'sv' ? 'sv-SE' : 'fr-FR'; const v = best(lang); if (v) u.voice = v;
      u.rate = rate || 0.85; u.pitch = 1.1;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) { /* silent */ }
  }
  window.TDSVoice = {
    get lang() { return lang; },
    setLang(l) { lang = l === 'sv' ? 'sv' : 'fr'; },
    has(code) { return !!best(code); },
    say,
    word(w) { say(w, 0.75); },
    grapheme(g) { say(G[lang][g] || g, 0.9); },
    warm() { voices(); }
  };
})();
