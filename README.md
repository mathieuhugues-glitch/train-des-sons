# Le train des sons · Ljudtåget 🚂

Petit jeu de lecture pour enfants (≈ 6 ans), en **français** et en **suédois**. Fonctionne hors ligne, sans pub, sans compte, sans collecte de données.

## Comment jouer
1. Toucher le drapeau 🇫🇷 ou 🇸🇪 (les étoiles en dessous = niveau, pour le parent).
2. Un mot est dit à voix haute et une image s'affiche (🔊 ou l'image pour réécouter).
3. Toucher ou glisser les wagons-lettres dans l'ordre pour accrocher le mot à la locomotive.
   - Bonne lettre : le wagon s'accroche et la lettre (ou le son : « ch », « ou », « on »…) est prononcée.
   - Mauvaise lettre : le wagon se dandine, aucune pénalité. Après 2 erreurs, le bon wagon brille.
4. Mot complet : le train siffle et part. 8 mots par partie, puis le train arrive en gare avec les autocollants et les étoiles (🌟 = mot sans erreur).

Le drapeau en haut à droite change de langue à tout moment ; 🎵 coupe les bruitages (pas la voix).

## Niveaux (par langue)
- ⭐ mots de 2–3 lettres réguliers · ⭐⭐ mots de 4–5 lettres · ⭐⭐⭐ sons complexes en wagons uniques (ch, ou, on, oi, eau, ain…) / å ä ö.
- Adaptatif : 3 mots de suite avec ≤ 1 erreur → niveau supérieur ; 2 mots de suite avec ≥ 4 erreurs → niveau inférieur. Mémorisé sur l'appareil.

## Technique
- Site statique (GitHub Pages, `.nojekyll`), aucun appel réseau externe. Service worker pour le hors-ligne, manifeste pour « Ajouter à l'écran d'accueil ».
- Voix : `speechSynthesis` du navigateur (meilleure voix fr-FR / sv-SE disponible). Sons : WebAudio synthétisés.
- Listes de mots : `js/words.js`. Test rapide : `tools/e2e.cjs` (Playwright).

## Conseil iPad
Pour une voix suédoise de bonne qualité : Réglages → Accessibilité → Contenu énoncé → Voix → Suédois, télécharger une voix « améliorée » (même chose pour le français). Un 🔇? sur l'écran d'accueil signale qu'aucune voix n'a été trouvée pour la langue.
