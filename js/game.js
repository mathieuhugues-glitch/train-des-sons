/* Le train des sons / Ljudtåget - game logic (solo, offline) */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s), $$ = (s) => Array.from(document.querySelectorAll(s));
  const S = window.TDSSound, V = window.TDSVoice, WORDS = window.TDS_WORDS, POOL = window.TDS_POOL, P = window.TDS_PAIRS;
  const SESSIONS = { train: 8, pairs: 10 }, FLAGS = { fr: '🇫🇷', sv: '🇸🇪' };
  const TITLES = { fr: 'Le train <span class="b">des sons</span>', sv: 'Ljud<span class="b">tåget</span>' };
  const LOCO = '<svg viewBox="0 0 150 120" aria-hidden="true"><rect x="30" y="16" width="24" height="9" rx="3" fill="#333"/><rect x="34" y="22" width="16" height="30" rx="4" fill="#444"/>' +
    '<rect x="20" y="46" width="84" height="42" rx="15" fill="#ef476f"/><rect x="20" y="62" width="84" height="6" fill="#d62f58"/><circle cx="72" cy="46" r="9" fill="#ffd166"/>' +
    '<rect x="96" y="24" width="48" height="64" rx="8" fill="#4361ee"/><rect x="92" y="16" width="56" height="11" rx="4" fill="#333"/><rect x="106" y="34" width="28" height="22" rx="6" fill="#bde0fe"/>' +
    '<circle cx="18" cy="60" r="8" fill="#ffd166" stroke="#e0a800" stroke-width="3"/><polygon points="4,100 22,80 22,100" fill="#555"/><rect x="12" y="84" width="136" height="10" rx="4" fill="#333"/>' +
    '<g fill="#333" stroke="#ddd" stroke-width="3"><circle cx="40" cy="100" r="12"/><circle cx="70" cy="100" r="12"/><circle cx="120" cy="96" r="17"/></g>' +
    '<g fill="#ddd"><circle cx="40" cy="100" r="3"/><circle cx="70" cy="100" r="3"/><circle cx="120" cy="96" r="4"/></g><rect x="38" y="97" width="84" height="5" rx="2" fill="#999"/></svg>';
  const MAXL = { train: 3, pairs: 4 };
  const key = (m, l) => (m === 'train' ? 'tds.level.' : 'tds.plevel.') + l;
  const level = { train: {}, pairs: {} };
  for (const m of ['train', 'pairs']) for (const l of ['fr', 'sv']) level[m][l] = Math.min(MAXL[m], Math.max(1, +localStorage.getItem(key(m, l)) || 1));
  let lang = localStorage.getItem('tds.lang') === 'sv' ? 'sv' : 'fr';
  let upper = localStorage.getItem('tds.case') === 'u';
  let mode = localStorage.getItem('tds.mode') === 'pairs' ? 'pairs' : 'train';
  let st = null; // session state
  const rnd = (n) => Math.floor(Math.random() * n);
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const strip = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const UP = (s) => s.toLocaleUpperCase(lang === 'sv' ? 'sv-SE' : 'fr-FR');
  const showCase = (g, cs) => ((cs || (upper ? 'u' : 'l')) === 'u' ? UP(g) : g);
  const lv = () => level[mode][lang];
  function show(id) { $$('.screen').forEach(s => s.classList.toggle('hidden', s.id !== id)); }
  function setLang(l) {
    lang = l; V.setLang(l); localStorage.setItem('tds.lang', l); document.documentElement.lang = l;
    $('#title').innerHTML = TITLES[l]; $('#swap').textContent = FLAGS[l === 'fr' ? 'sv' : 'fr'];
    $$('#langSeg button').forEach(b => b.classList.toggle('on', b.dataset.lang === l)); checkVoices();
  }
  function setLevel(m, l, n) { level[m][l] = n; localStorage.setItem(key(m, l), n); renderLevels(); }
  function paintCase() {
    $$('#caseSeg button').forEach(b => b.classList.toggle('on', (b.dataset.case === 'u') === upper));
    $('#caseBtn').textContent = upper ? 'ABC' : 'abc'; document.body.classList.toggle('upper', upper);
  }
  function setCase(u) {
    upper = u; localStorage.setItem('tds.case', u ? 'u' : 'l'); paintCase();
    if (!st || $('#game').classList.contains('hidden')) return;
    if (mode === 'pairs') { // flip prompt and answers
      $$('#game .wagon[data-case]').forEach(w => { w.dataset.case = w.dataset.case === 'u' ? 'l' : 'u'; w.firstChild.textContent = showCase(w.dataset.g, w.dataset.case); });
      st.pcase = st.pcase === 'u' ? 'l' : 'u'; $('#pic').textContent = showCase(st.word.text, st.pcase);
    } else $$('#game .wagon').forEach(w => { w.firstChild.textContent = showCase(w.dataset.g); });
  }

  /* ---------- start screen ---------- */
  function renderLevels() {
    $$('.lv').forEach(box => {
      const m = box.dataset.mode; box.innerHTML = '';
      for (let n = 1; n <= MAXL[m]; n++) {
        const b = document.createElement('button'); b.textContent = n === 4 ? '🔀' : '⭐'.repeat(n); b.dataset.n = n; b.className = n === level[m][lang] ? 'on' : '';
        b.setAttribute('aria-label', 'Niveau ' + n); b.onclick = () => { S.unlock(); S.pick(); setLevel(m, lang, n); }; box.appendChild(b);
      }
    });
  }
  function checkVoices() { const n = $('#novoice'); if (n) n.classList.toggle('hidden', ('speechSynthesis' in window) && V.has(lang)); }

  /* ---------- game ---------- */
  function startSession(m) {
    S.unlock(); V.warm(); mode = m; localStorage.setItem('tds.mode', m); setLang(lang);
    st = { done: [], used: new Set(), streak: 0, bad: 0 };
    show('game'); $('#game').dataset.mode = m; renderDots(); nextItem(true);
  }
  function renderDots() {
    $('#dots').innerHTML = Array.from({ length: SESSIONS[mode] }, (_, i) => '<i class="' + (i < st.done.length ? 'ok' : i === st.done.length ? 'cur' : '') + '"></i>').join('');
  }
  function pickWord() {
    const list = WORDS[lang][lv() - 1];
    let cands = list.filter(w => !st.used.has(w.text)); if (!cands.length) cands = list;
    const w = cands[rnd(cands.length)]; st.used.add(w.text); return w;
  }
  function distractors(w) {
    const n = [2, 3, 4][lv() - 1], word = strip(w.text);
    const pool = shuffle(POOL[lang][lv() - 1].filter(d => !(lang === 'fr' ? word.includes(strip(d)) : w.text.includes(d))));
    const out = []; for (const d of pool) { if (out.length >= n) break; if (!out.includes(d)) out.push(d); } return out;
  }
  function sizes(n) {
    const W = window.innerWidth * 0.94, H = window.innerHeight, gap = Math.max(5, Math.round(W * 0.008));
    const w = Math.floor(Math.min(140, (W - gap * (n + 1)) / (1.5 + n), H * 0.17));
    const tw = Math.floor(Math.max(64, Math.min(window.innerWidth * 0.15, H * 0.15, 120)));
    const g = $('#game'); g.style.setProperty('--w', w + 'px'); g.style.setProperty('--tw', tw + 'px'); g.style.setProperty('--gap', gap + 'px');
  }
  function wagonEl(g, ci, cs) {
    const b = document.createElement('button'); b.className = 'wagon c' + (ci % 7); b.dataset.g = g; b.dataset.len = Math.min(3, Array.from(g).length);
    if (cs) b.dataset.case = cs;
    b.innerHTML = '<span class="lt"></span>'; b.firstChild.textContent = showCase(g, cs); return b;
  }
  function freshTrain(nSlots) {
    const train = $('#train'); train.className = 'train'; train.innerHTML = '<div class="loco">' + LOCO + '<i class="puff"></i><i class="puff p2"></i><i class="puff p3"></i></div>';
    for (let i = 0; i < nSlots; i++) { const s = document.createElement('div'); s.className = 'slot'; s.dataset.i = i; train.appendChild(s); }
    return train;
  }
  function fillTray(items) { // items: [g, case]
    const tray = $('#tray'); tray.innerHTML = '';
    const cols = shuffle(Array.from({ length: 7 }, (_, i) => i));
    shuffle(items).forEach(([g, cs], i) => { const el = wagonEl(g, cols[i % 7], cs); el.style.setProperty('--d', (-Math.random() * 2.4).toFixed(2) + 's'); bindWagon(el); tray.appendChild(el); });
  }
  function popPic(content, isLetter) { const pic = $('#pic'); pic.textContent = content; pic.classList.toggle('letter', !!isLetter); pic.classList.remove('pop'); void pic.offsetWidth; pic.classList.add('pop'); }
  function nextItem(first) { if (mode === 'pairs') nextPair(first); else nextWord(first); }
  function nextWord(first) {
    const w = pickWord(); st.word = w; st.pos = 0; st.miss = 0; st.since = 0; st.busy = false;
    sizes(w.g.length); popPic(w.pic);
    const train = freshTrain(w.g.length); train.querySelector('.slot').classList.add('next');
    void train.offsetWidth; train.classList.add('arrive');
    fillTray(w.g.concat(distractors(w)).map(g => [g]));
    setTimeout(() => V.word(w.text), first ? 300 : 700);
    window.__tds = { mode, word: w, next: () => st.word.g[st.pos], level: lv(), lang, done: st.done.length };
  }
  /* ---------- pairs (big/small letters) ---------- */
  function nextPair(first) {
    const p = P.pick(lang, lv(), st.used, Math.random); st.used.add(p.target);
    const pcase = lv() === 4 ? (Math.random() < 0.5 ? 'u' : 'l') : (upper ? 'u' : 'l'), acase = pcase === 'u' ? 'l' : 'u';
    st.word = { g: [p.target, p.target], text: p.target }; st.pcase = pcase; st.pos = 1; st.miss = 0; st.since = 0; st.busy = false;
    sizes(2); popPic(showCase(p.target, pcase), true);
    const train = freshTrain(2), s0 = train.querySelector('.slot[data-i="0"]');
    s0.appendChild(wagonEl(p.target, rnd(7), pcase)); s0.classList.add('full'); train.querySelector('.slot[data-i="1"]').classList.add('next');
    void train.offsetWidth; train.classList.add('arrive');
    fillTray([p.target].concat(p.distractors).map(g => [g, acase]));
    setTimeout(() => V.grapheme(p.target), first ? 300 : 700);
    window.__tds = { mode, word: st.word, target: p.target, pcase, next: () => st.word.g[st.pos], level: lv(), lang, done: st.done.length };
  }
  function bindWagon(el) {
    let sx = 0, sy = 0, drag = false, id = null;
    el.addEventListener('pointerdown', (e) => {
      if (el.classList.contains('used') || st.busy) return;
      id = e.pointerId; sx = e.clientX; sy = e.clientY; drag = false; try { el.setPointerCapture(id); } catch (x) {}
      el.classList.remove('back', 'wobble'); S.unlock();
    });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return; const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!drag && Math.hypot(dx, dy) > 10) { drag = true; el.classList.add('drag'); S.pick(); }
      if (drag) el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.1)';
    });
    const end = (e, cancel) => {
      if (e.pointerId !== id) return; id = null;
      if (!drag) { if (!cancel) attempt(el); return; }
      drag = false; el.classList.remove('drag');
      const trayTop = $('#tray').getBoundingClientRect().top;
      if (!cancel && e.clientY < trayTop) attempt(el, true); else goBack(el);
    };
    el.addEventListener('pointerup', (e) => end(e, false));
    el.addEventListener('pointercancel', (e) => end(e, true));
  }
  function goBack(el) { el.classList.add('back'); el.style.transform = ''; setTimeout(() => el.classList.remove('back'), 320); }
  function attempt(el) {
    if (st.busy || el.classList.contains('used')) return;
    const need = st.word.g[st.pos];
    if (el.dataset.g === need) {
      const i = st.pos++; st.since = 0; $$('#tray .glow').forEach(x => x.classList.remove('glow'));
      S.clack(); V.grapheme(need); flyTo(el, i);
      if (st.pos >= st.word.g.length) { st.busy = true; setTimeout(complete, 450); }
      else { const nx = $('#train .slot[data-i="' + st.pos + '"]'); if (nx) nx.classList.add('next'); }
    } else {
      st.miss++; st.since++; S.boing();
      el.style.transform = ''; el.classList.remove('back', 'wobble'); void el.offsetWidth; el.classList.add('wobble');
      setTimeout(() => el.classList.remove('wobble'), 600);
      if (st.since >= 2) { const ok = $$('#tray .wagon:not(.used)').find(x => x.dataset.g === need); if (ok) ok.classList.add('glow'); }
    }
  }
  function flyTo(el, i) {
    const slot = $('#train .slot[data-i="' + i + '"]'); slot.classList.remove('next');
    const from = el.getBoundingClientRect(), to = slot.getBoundingClientRect();
    const fl = el.cloneNode(true); fl.className = el.className.replace(/\b(drag|glow|wobble|back)\b/g, '') + ' flyer';
    fl.style.cssText = 'left:' + from.left + 'px;top:' + from.top + 'px;width:' + from.width + 'px;height:' + from.height + 'px;--s:' + from.width + 'px;transform:none';
    document.body.appendChild(fl); el.classList.add('used'); el.style.transform = '';
    requestAnimationFrame(() => requestAnimationFrame(() => { fl.style.transform = 'translate(' + (to.left - from.left) + 'px,' + (to.top - from.top) + 'px) scale(' + (to.width / from.width) + ')'; }));
    setTimeout(() => { fl.remove(); const w = wagonEl(el.dataset.g, +(el.className.match(/c(\d)/) || [0, 0])[1], el.dataset.case); slot.appendChild(w); slot.classList.add('full'); }, 360);
  }
  function sparks(n, emojis) {
    const fx = $('#fx'), r = $('#pic').getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let k = 0; k < n; k++) {
      const s = document.createElement('span'); s.className = 'spark'; s.textContent = emojis[k % emojis.length];
      const a = Math.random() * Math.PI * 2, d = 80 + Math.random() * Math.min(innerWidth, innerHeight) * 0.4;
      s.style.left = cx + 'px'; s.style.top = cy + 'px'; s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px');
      fx.appendChild(s); setTimeout(() => s.remove(), 1400);
    }
  }
  function adapt() {
    if (st.miss <= 1) st.streak++; else st.streak = 0;
    if (st.miss >= 4) st.bad++; else st.bad = 0;
    let shown = null; const top = 3; // "mixed" (4) only via the parent picker
    if (st.streak >= 3 && lv() < top) { setLevel(mode, lang, lv() + 1); st.streak = 0; shown = '⭐'.repeat(lv()); }
    if (st.bad >= 2 && lv() > 1 && lv() <= top) { setLevel(mode, lang, lv() - 1); st.bad = 0; }
    return shown;
  }
  function complete() {
    const w = st.word;
    if (mode === 'pairs') { st.done.push({ text: UP(w.text) + w.text, perfect: st.miss === 0 }); V.grapheme(w.text); sparks(12, ['⭐', '✨', '🎉']); }
    else { st.done.push({ pic: w.pic, perfect: st.miss === 0 }); V.word(w.text); sparks(14, ['⭐', '✨', '🎉', w.pic]); }
    renderDots();
    setTimeout(() => { S.toot(); S.chug(); $('#train').classList.add('leave'); }, 900);
    const up = adapt();
    if (up) setTimeout(() => { const l = $('#lvlup'); l.textContent = up; l.classList.remove('hidden'); S.star(); setTimeout(() => l.classList.add('hidden'), 1600); }, 1300);
    setTimeout(() => { if (st.done.length >= SESSIONS[mode]) endScreen(); else nextItem(); }, up ? 3000 : 2500);
  }
  /* ---------- end screen ---------- */
  function endScreen() {
    show('end'); S.toot();
    const t = $('#endtrain'); t.innerHTML = '<div class="loco">' + LOCO + '<i class="puff"></i><i class="puff p2"></i></div>';
    const n = st.done.length, tw = Math.floor(Math.max(36, Math.min(innerWidth * 0.92 / (n + 1.7), innerHeight * 0.13, 120)));
    t.style.setProperty('--tw', tw + 'px'); t.style.setProperty('--w', tw + 'px');
    st.done.forEach((d, i) => { const w = wagonEl('', i); w.firstChild.textContent = d.pic || d.text; if (d.text) w.firstChild.classList.add('txt');
      w.firstChild.classList.add('pop'); w.firstChild.style.animationDelay = (2 + i * 0.15) + 's'; t.appendChild(w); });
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    const stars = st.done.map((d, i) => '<span style="animation-delay:' + (2.2 + i * 0.15) + 's">' + (d.perfect ? '🌟' : '⭐') + '</span>').join('');
    $('#endStars').innerHTML = stars;
    setTimeout(() => { S.fanfare(); V.say(lang === 'sv' ? 'Bra jobbat!' : 'Bravo !', 0.9); }, 2000);
    window.__tds = { end: true, done: st.done.length };
  }

  /* ---------- wiring ---------- */
  $('#trainIco').innerHTML = LOCO;
  $$('.modebtn').forEach(b => b.onclick = () => startSession(b.dataset.mode));
  $$('#langSeg button').forEach(b => b.onclick = () => { S.unlock(); S.pick(); setLang(b.dataset.lang); renderLevels(); });
  $$('#caseSeg button').forEach(b => b.onclick = () => { S.unlock(); S.pick(); setCase(b.dataset.case === 'u'); });
  $('#caseBtn').onclick = () => { S.unlock(); S.pick(); setCase(!upper); };
  $('#home').onclick = () => { try { speechSynthesis.cancel(); } catch (e) {} show('start'); renderLevels(); checkVoices(); };
  $('#home2').onclick = () => { show('start'); renderLevels(); checkVoices(); };
  $('#again').onclick = () => startSession(mode);
  const replay = () => { if (!st) return; if (mode === 'pairs') V.grapheme(st.word.text); else V.word(st.word.text); };
  $('#replay').onclick = () => { S.unlock(); replay(); };
  $('#pic').onclick = () => { replay(); const p = $('#pic'); p.classList.remove('pop'); void p.offsetWidth; p.classList.add('pop'); };
  $('#swap').onclick = () => { if (st.busy) return; S.pick(); setLang(lang === 'fr' ? 'sv' : 'fr'); st.used = new Set(); nextItem(); };
  const muteBtn = $('#mute'); const paintMute = () => { muteBtn.textContent = S.muted ? '🔇' : '🎵'; };
  muteBtn.onclick = () => { S.setMuted(!S.muted); paintMute(); }; paintMute();
  window.addEventListener('resize', () => { if (st && st.word && !$('#game').classList.contains('hidden')) sizes(st.word.g.length); });
  setLang(lang); paintCase(); renderLevels(); V.warm(); setTimeout(checkVoices, 800);
  try { speechSynthesis.addEventListener('voiceschanged', checkVoices); } catch (e) {}
})();
