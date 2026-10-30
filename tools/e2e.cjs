// Minimal smoke test: one session in French (with 2 wrong taps -> glow help) and one in Swedish, both reach the end screen.
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
async function session(page, lang, shot) {
  await page.click(`.flagbtn[data-go="${lang}"]`); await sleep(1300);
  const words = [];
  for (let n = 0; n < 8; n++) {
    await page.waitForFunction(k => window.__tds && window.__tds.done === k && !document.querySelector('#train').classList.contains('leave'), n, { timeout: 8000 });
    await sleep(1100);
    const w = await playWord(page, n === 1 ? shot : null, lang === 'fr' && n === 0);
    words.push(w.text + ' (L' + (await page.evaluate(() => window.__tds.level)) + ')');
  }
  await page.waitForSelector('#end:not(.hidden)', { timeout: 8000 });
  check(true, lang + ' session done: ' + words.join(', '));
  check((await page.$$('#endtrain .wagon')).length === 8, lang + ': end train with 8 stickers');
}
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (!r.url().startsWith(BASE)) errors.push('external request: ' + r.url()); });
  await page.goto(BASE); await page.evaluate(() => localStorage.clear()); await page.reload();
  await session(page, 'fr', '01-jeu-fr-ipad.png');
  await sleep(3000); await page.screenshot({ path: SHOTS + '02-fin-ipad.png' });
  await page.click('#home2');
  await session(page, 'sv', null);
  check(errors.length === 0, 'no page errors / external requests ' + errors.join(' | '));
  await browser.close();
  console.log(fails ? fails + ' FAILED' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
