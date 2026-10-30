/* Le train des sons / Ljudtåget - game logic (solo, offline) */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s), $$ = (s) => Array.from(document.querySelectorAll(s));
  const S = window.TDSSound, V = window.TDSVoice, WORDS = window.TDS_WORDS, POOL = window.TDS_POOL;
  const SESSION = 8, FLAGS = { fr: '🇫🇷', sv: '🇸🇪' };
  const TITLES = { fr: 'Le train <span class="b">des sons</span>', sv: 'Ljud<span class="b">tåget</span>' };
  const LOCO = '<svg viewBox="0 0 150 120" aria-hidden="true"><rect x="30" y="16" width="24" height="9" rx="3" fill="#333"/><rect x="34" y="22" width="16" height="30" rx="4" fill="#444"/>' +
    '<rect x="20" y="46" width="84" height="42" rx="15" fill="#ef476f"/><rect x="20" y="62" width="84" height="6" fill="#d62f58"/><circle cx="72" cy="46" r="9" fill="#ffd166"/>' +
    '<rect x="96" y="24" width="48" height="64" rx="8" fill="#4361ee"/><rect x="92" y="16" width="56" height="11" rx="4" fill="#333"/><rect x="106" y="34" width="28" height="22" rx="6" fill="#bde0fe"/>' +
    '<circle cx="18" cy="60" r="8" fill="#ffd166" stroke="#e0a800" stroke-width="3"/><polygon points="4,100 22,80 22,100" fill="#555"/><rect x="12" y="84" width="136" height="10" rx="4" fill="#333"/>' +
    '<g fill="#333" stroke="#ddd" stroke-width="3"><circle cx="40" cy="100" r="12"/><circle cx="70" cy="100" r="12"/><circle cx="120" cy="96" r="17"/></g>' +
    '<g fill="#ddd"><circle cx="40" cy="100" r="3"/><circle cx="70" cy="100" r="3"/><circle cx="120" cy="96" r="4"/></g><rect x="38" y="97" width="84" height="5" rx="2" fill="#999"/></svg>';
  const key = (l) => 'tds.level.' + l;
  const level = { fr: Math.min(3, Math.max(1, +localStorage.getItem(key('fr')) || 1)), sv: Math.min(3, Math.max(1, +localStorage.getItem(key('sv')) || 1)) };
  let lang = localStorage.getItem('tds.lang') === 'sv' ? 'sv' : 'fr';
  let st = null; // session state
  const rnd = (n) => Math.floor(Math.random() * n);
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const strip = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  function show(id) { $$('.screen').forEach(s => s.classList.toggle('hidden', s.id !== id)); }
  function setLang(l) {
    lang = l; V.setLang(l); localStorage.setItem('tds.lang', l); document.documentElement.lang = l;
    $('#title').innerHTML = TITLES[l]; $('#swap').textContent = FLAGS[l === 'fr' ? 'sv' : 'fr'];
  }
  function setLevel(l, n) { level[l] = n; localStorage.setItem(key(l), n); renderLevels(); }

  /* ---------- start screen ---------- */
  function renderLevels() {
    $$('.lv').forEach(box => {
      const l = box.dataset.lang; box.innerHTML = '';
      for (let n = 1; n <= 3; n++) {
        const b = document.createElement('button'); b.textContent = '⭐'.repeat(n); b.dataset.n = n; b.className = n === level[l] ? 'on' : '';
        b.setAttribute('aria-label', 'Niveau ' + n); b.onclick = () => { S.unlock(); S.pick(); setLevel(l, n); }; box.appendChild(b);
      }
    });
  }
  function checkVoices() { $$('.novoice').forEach(n => n.classList.toggle('hidden', !('speechSynthesis' in window) ? false : V.has(n.dataset.lang))); }

  /* ---------- game ---------- */
  function startSession(l) {
    S.unlock(); setLang(l); V.warm();
    st = { done: [], used: new Set(), streak: 0, bad: 0 };
    show('game'); renderDots(); nextWord(true);
  }
  function renderDots() {
    $('#dots').innerHTML = Array.from({ length: SESSION }, (_, i) => '<i class="' + (i < st.done.length ? 'ok' : i === st.done.length ? 'cur' : '') + '"></i>').join('');
  }
  function pickWord() {
    const list = WORDS[lang][level[lang] - 1];
    let cands = list.filter(w => !st.used.has(w.text)); if (!cands.length) cands = list;
    const w = cands[rnd(cands.length)]; st.used.add(w.text); return w;
  }
  function distractors(w) {
    const n = [2, 3, 4][level[lang] - 1], word = strip(w.text);
    const pool = shuffle(POOL[lang][level[lang] - 1].filter(d => !(lang === 'fr' ? word.includes(strip(d)) : w.text.includes(d))));
    const out = []; for (const d of pool) { if (out.length >= n) break; if (!out.includes(d)) out.push(d); } return out;
  }
  function sizes(n) {
    const W = window.innerWidth * 0.94, H = window.innerHeight, gap = Math.max(5, Math.round(W * 0.008));
    const w = Math.floor(Math.min(140, (W - gap * (n + 1)) / (1.5 + n), H * 0.17));
    const tw = Math.floor(Math.max(64, Math.min(window.innerWidth * 0.15, H * 0.15, 120)));
    const g = $('#game'); g.style.setProperty('--w', w + 'px'); g.style.setProperty('--tw', tw + 'px'); g.style.setProperty('--gap', gap + 'px');
  }
  function wagonEl(g, ci) {
    const b = document.createElement('button'); b.className = 'wagon c' + (ci % 7); b.dataset.g = g; b.dataset.len = Math.min(3, Array.from(g).length);
    b.innerHTML = '<span class="lt"></span>'; b.firstChild.textContent = g; return b;
  }
  function nextWord(first) {
    const w = pickWord(); st.word = w; st.pos = 0; st.miss = 0; st.since = 0; st.busy = false;
    sizes(w.g.length);
    const pic = $('#pic'); pic.textContent = w.pic; pic.classList.remove('pop'); void pic.offsetWidth; pic.classList.add('pop');
    const train = $('#train'); train.className = 'train'; train.innerHTML = '<div class="loco">' + LOCO + '<i class="puff"></i><i class="puff p2"></i><i class="puff p3"></i></div>';
    w.g.forEach((_, i) => { const s = document.createElement('div'); s.className = 'slot' + (i === 0 ? ' next' : ''); s.dataset.i = i; train.appendChild(s); });
    void train.offsetWidth; train.classList.add('arrive');
    const tray = $('#tray'); tray.innerHTML = '';
    const cols = shuffle(Array.from({ length: 7 }, (_, i) => i));
    shuffle(w.g.concat(distractors(w))).forEach((g, i) => { const el = wagonEl(g, cols[i % 7]); el.style.setProperty('--d', (-Math.random() * 2.4).toFixed(2) + 's'); bindWagon(el); tray.appendChild(el); });
    setTimeout(() => V.word(w.text), first ? 300 : 700);
    window.__tds = { word: w, next: () => st.word.g[st.pos], level: level[lang], lang, done: st.done.length };
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
    setTimeout(() => { fl.remove(); const w = wagonEl(el.dataset.g, +(el.className.match(/c(\d)/) || [0, 0])[1]); slot.appendChild(w); slot.classList.add('full'); }, 360);
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
    let shown = null;
    if (st.streak >= 3 && level[lang] < 3) { setLevel(lang, level[lang] + 1); st.streak = 0; shown = '⭐'.repeat(level[lang]); }
    if (st.bad >= 2 && level[lang] > 1) { setLevel(lang, level[lang] - 1); st.bad = 0; }
    return shown;
  }
  function complete() {
    const w = st.word;
    st.done.push({ pic: w.pic, perfect: st.miss === 0 }); renderDots();
    V.word(w.text); sparks(14, ['⭐', '✨', '🎉', w.pic]);
    setTimeout(() => { S.toot(); S.chug(); $('#train').classList.add('leave'); }, 900);
    const up = adapt();
    if (up) setTimeout(() => { const l = $('#lvlup'); l.textContent = up; l.classList.remove('hidden'); S.star(); setTimeout(() => l.classList.add('hidden'), 1600); }, 1300);
    setTimeout(() => { if (st.done.length >= SESSION) endScreen(); else nextWord(); }, up ? 3000 : 2500);
  }
  /* ---------- end screen ---------- */
  function endScreen() {
    show('end'); S.toot();
    const t = $('#endtrain'); t.innerHTML = '<div class="loco">' + LOCO + '<i class="puff"></i><i class="puff p2"></i></div>';
    st.done.forEach((d, i) => { const w = wagonEl('', i); w.firstChild.textContent = d.pic; w.firstChild.classList.add('pop'); w.firstChild.style.animationDelay = (2 + i * 0.15) + 's'; t.appendChild(w); });
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    const stars = st.done.map((d, i) => '<span style="animation-delay:' + (2.2 + i * 0.15) + 's">' + (d.perfect ? '🌟' : '⭐') + '</span>').join('');
    $('#endStars').innerHTML = stars;
    setTimeout(() => { S.fanfare(); V.say(lang === 'sv' ? 'Bra jobbat!' : 'Bravo !', 0.9); }, 2000);
    window.__tds = { end: true, done: st.done.length };
  }

  /* ---------- wiring ---------- */
  $('#hero').innerHTML = LOCO;
  $$('.flagbtn').forEach(b => b.onclick = () => startSession(b.dataset.go));
  $('#home').onclick = () => { try { speechSynthesis.cancel(); } catch (e) {} show('start'); checkVoices(); };
  $('#home2').onclick = () => { show('start'); checkVoices(); };
  $('#again').onclick = () => startSession(lang);
  $('#replay').onclick = () => { S.unlock(); st && V.word(st.word.text); };
  $('#pic').onclick = () => { st && V.word(st.word.text); const p = $('#pic'); p.classList.remove('pop'); void p.offsetWidth; p.classList.add('pop'); };
  $('#swap').onclick = () => { if (st.busy) return; S.pick(); setLang(lang === 'fr' ? 'sv' : 'fr'); nextWord(); };
  const muteBtn = $('#mute'); const paintMute = () => { muteBtn.textContent = S.muted ? '🔇' : '🎵'; };
  muteBtn.onclick = () => { S.setMuted(!S.muted); paintMute(); }; paintMute();
  window.addEventListener('resize', () => { if (st && st.word && !$('#game').classList.contains('hidden')) sizes(st.word.g.length); });
  setLang(lang); renderLevels(); V.warm(); setTimeout(checkVoices, 800);
  try { speechSynthesis.addEventListener('voiceschanged', checkVoices); } catch (e) {}
})();
