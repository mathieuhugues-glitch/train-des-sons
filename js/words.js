/* Le train des sons / Ljudtåget - word lists.
   Format "word emoji". Words with multi-letter wagons (graphemes) use dots: "ch.a.t 🐱" -> wagons ch | a | t.
   Level 1: 2-3 letters, regular. Level 2: 4-5 letters. Level 3: graphemes (FR) / å ä ö (SV). */
(function () {
  'use strict';
  const RAW = {
    fr: [
      'lit 🛏️|riz 🍚|sac 👜|bus 🚌|os 🦴|ski 🎿|nid 🪺|sel 🧂|bol 🥣|dé 🎲|ver 🪱|mur 🧱|fil 🧵|nez 👃|mer 🌊|arc 🏹|île 🏝️|fée 🧚|coq 🐓|rat 🐀|jus 🧃|thé 🍵|clé 🔑|âne 🫏',
      'lune 🌙|lapin 🐰|robot 🤖|moto 🏍️|vélo 🚲|kiwi 🥝|lama 🦙|pomme 🍎|tigre 🐯|zèbre 🦓|fusée 🚀|olive 🫒|pizza 🍕|bébé 👶|nuage ☁️|rose 🌹|café ☕|judo 🥋|koala 🐨|piano 🎹|radio 📻|ours 🐻|taxi 🚕|livre 📖|arbre 🌳|pile 🔋',
      'ch.a.t 🐱|ch.i.en 🐶|m.ou.t.on 🐑|p.oi.s.s.on 🐟|l.ou.p 🐺|p.ou.l.e 🐔|r.oi 🤴|oi.s.eau 🐦|b.a.t.eau ⛵|c.a.d.eau 🎁|v.a.ch.e 🐄|c.o.ch.on 🐷|m.ai.s.on 🏠|s.a.p.in 🎄|b.a.l.l.on 🎈|b.on.b.on 🍬|ch.â.t.eau 🏰|f.ou.r.m.i 🐜|h.i.b.ou 🦉|é.t.oi.l.e ⭐|p.oi.r.e 🍐|f.eu 🔥|ph.o.t.o 📷|r.e.qu.in 🦈|a.v.i.on ✈️|t.r.ain 🚆|m.ain ✋|l.ai.t 🥛'
    ],
    sv: [
      'is 🧊|ko 🐄|sol ☀️|bil 🚗|mus 🐭|fot 🦶|ost 🧀|get 🐐|ben 🦴|bok 📕|hus 🏠|ris 🍚|te 🍵|bi 🐝|orm 🐍|arm 💪|lok 🚂|sko 👟|ros 🌹|mun 👄|sax ✂️|pil 🏹|tv 📺|apa 🐒',
      'katt 🐱|hund 🐶|lampa 💡|banan 🍌|fisk 🐟|hatt 🎩|buss 🚌|tand 🦷|glass 🍦|gris 🐷|anka 🦆|kanin 🐰|uggla 🦉|tiger 🐯|zebra 🦓|robot 🤖|pizza 🍕|boll ⚽|stol 🪑|korv 🌭|kaka 🍪|tomat 🍅|druva 🍇|drake 🐉|raket 🚀|cykel 🚲|panda 🐼|groda 🐸',
      'båt ⛵|äpple 🍎|björn 🐻|gröt 🥣|ägg 🥚|säl 🦭|lök 🧅|tåg 🚆|måne 🌙|snö ❄️|säng 🛏️|öga 👁️|öra 👂|häst 🐴|mjölk 🥛|smör 🧈|päron 🍐|fågel 🐦|räv 🦊|höna 🐔|tårta 🎂|dörr 🚪|bröd 🍞|räka 🦐|näsa 👃|blåbär 🫐'
    ]
  };
  const W = {};
  for (const l of Object.keys(RAW)) W[l] = RAW[l].map(level => level.split('|').map(s => {
    const [w, pic] = s.trim().split(' ');
    const g = w.includes('.') ? w.split('.') : Array.from(w);
    return { g, pic, text: g.join('') };
  }));
  window.TDS_WORDS = W;
  // Distractor pools (letters used for "wrong" wagons)
  window.TDS_POOL = {
    fr: [Array.from('abcdefilmnoprstuv'), Array.from('abcdefgilmnoprstuvz'), Array.from('abdefilmnoprstuv').concat(['ch', 'ou', 'on', 'oi', 'an', 'in', 'eau', 'ai'])],
    sv: [Array.from('abdefgiklmnoprstuv'), Array.from('abdefgiklmnoprstuvy'), Array.from('abdefgiklmnoprstuv').concat(['å', 'ä', 'ö', 'å', 'ä', 'ö'])]
  };
})();
