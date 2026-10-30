// Minimal smoke test: case toggle (ABC) + one French word-train session (2 wrong taps -> glow help) + one Swedish « paires de lettres » session.
// Usage: serve the folder on :8771, then NODE_PATH=/workspace/geo-party-build/node_modules node tools/e2e.cjs
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8771/';
const SHOTS = __dirname + '/../screens/';
let fails = 0; const check = (c, m) => { if (!c) { fails++; console.error('FAIL:', m); } else console.log('ok:', m); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function playWord(page, shot, wrongFirst) {
  const w = await page.evaluate(() => window.__tds.word);
  if (wrongFirst) {
    const bad = await page.$$eval('#tray .wagon', (els, need) => els.map(e => e.dataset.g).filter(g => g !== need), w.g[0]);
    for (let k = 0; k < 2; k++) { await page.click(`#tray .wagon[data-g="${bad[0]}"]`, { force: true }); await sleep(650); }
    check(await page.$eval(`#tray .wagon[data-g="${w.g[0]}"]`, e => e.classList.contains('glow')), 'help glow after 2 mistakes (' + w.text + ')');
  }
  for (let i = 0; i < w.g.length; i++) {
    await page.click(`#tray .wagon[data-g="${w.g[i]}"]:not(.used)`, { force: true }); await sleep(120);
    if (shot && i === w.g.length - 2) { await sleep(400); await page.screenshot({ path: SHOTS + shot }); }
  }
  return w;
}
async function session(page, lang, shot, nWords) {
  await page.click(`#langSeg button[data-lang="${lang}"]`); await page.click('.modebtn[data-mode="train"]'); await sleep(1300);
  const words = [];
  for (let n = 0; n < (nWords || 8); n++) {
    await page.waitForFunction(k => window.__tds && window.__tds.done === k && !document.querySelector('#train').classList.contains('leave'), n, { timeout: 8000 });
    await sleep(1100);
    const w = await playWord(page, n === 1 ? shot : null, lang === 'fr' && n === 0);
    words.push(w.text + ' (L' + (await page.evaluate(() => window.__tds.level)) + ')');
  }
  await page.waitForSelector('#end:not(.hidden)', { timeout: 8000 });
  check(true, lang + ' session done: ' + words.join(', '));
  check((await page.$$('#endtrain .wagon')).length === 8, lang + ': end train with 8 stickers');
}
async function pairs(page, lang, shot) {
  await page.click(`#langSeg button[data-lang="${lang}"]`);
  await page.click('.lv[data-mode="pairs"] button[data-n="3"]'); await page.click('.modebtn[data-mode="pairs"]'); await sleep(1300);
  const seen = [];
  for (let n = 0; n < 10; n++) {
    await page.waitForFunction(k => window.__tds && window.__tds.done === k && !document.querySelector('#train').classList.contains('leave'), n, { timeout: 8000 });
    await sleep(1100);
    const info = await page.evaluate(() => ({ t: window.__tds.target, pc: window.__tds.pcase, prompt: document.querySelector('#train .slot .wagon').textContent,
      answers: Array.from(document.querySelectorAll('#tray .wagon')).map(w => w.textContent) }));
    const up = info.t.toLocaleUpperCase('sv-SE');
    if (n === 0) check(info.pc === 'u' && info.prompt === up && info.answers.every(a => a === a.toLowerCase()) && info.answers.includes(info.t), 'pairs: prompt ' + info.prompt + ' (ABC) answers ' + info.answers.join(' '));
    if (n === 2) shot && await page.screenshot({ path: SHOTS + shot });
    await page.click(`#tray .wagon[data-g="${info.t}"]`, { force: true });
    seen.push(info.prompt + info.t);
  }
  await page.waitForSelector('#end:not(.hidden)', { timeout: 8000 });
  check((await page.$$('#endtrain .wagon')).length === 10, 'pairs ' + lang + ': 10 pairs done → end train (' + seen.join(' ') + ')');
}
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (!r.url().startsWith(BASE)) errors.push('external request: ' + r.url()); });
  await page.goto(BASE); await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.click('#caseSeg button[data-case="u"]');
  check(await page.evaluate(() => localStorage.getItem('tds.case') === 'u'), 'case toggle ABC saved');
  await session(page, 'fr', '03-majuscules-ipad.png');
  const endTxt = await page.isVisible('#end'); check(endTxt, 'fr train session reached end screen');
  await page.click('#home2');
  // in-game case toggle on a train word
  await page.click('.modebtn[data-mode="train"]'); await sleep(1500);
  const before = await page.$$eval('#tray .wagon', ws => ws.map(w => w.textContent));
  await page.click('#caseBtn'); const after = await page.$$eval('#tray .wagon', ws => ws.map(w => w.textContent));
  check(before.every(x => x === x.toLocaleUpperCase('fr-FR')) && after.every(x => x === x.toLocaleLowerCase('fr-FR')), 'in-game toggle: ' + before.join(' ') + ' → ' + after.join(' '));
  await page.click('#caseBtn'); await page.click('#home');
  await pairs(page, 'sv', '04-paires-ipad.png');
  check(errors.length === 0, 'no page errors / external requests ' + errors.join(' | '));
  await browser.close();
  console.log(fails ? fails + ' FAILED' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
