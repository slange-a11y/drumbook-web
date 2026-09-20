/* Bildprüfung für die Bühnen — in die Konsole der geöffneten Seite werfen.
 *
 * Warum es das gibt: Am 20.09.2026 sind an den Motiven drei Fehler
 * nacheinander aufgefallen, jeder von Silvio gesehen und keiner von mir —
 * weil ich auf Screenshots geschaut statt gemessen habe. Die Fehler waren
 * alle aus derselben Familie: Ein Foto ist dort sichtbar, wo kein Schleier
 * mehr über ihm liegt.
 *
 * Die Regel dahinter, und sie ist die ganze Prüfung wert:
 *
 *   Der Schleier klebt am Abschnitt (`inset: 0`), das Foto darf über ihn
 *   hinausragen. Überall, wo das Foto weiter reicht als der Schleier, muss
 *   die Blende es ausgeblendet haben — sonst steht dort ungedämpftes Bild.
 *
 * Daraus die drei Prüfungen:
 *   1. Clip-Rand > 0 (Foto darf oben hinaus) → Blende muss oben bei 0 anfangen.
 *   2. Blende oben offen → Clip-Rand muss > 0 sein, sonst sieht man den
 *      Übergang gar nicht und die Kante ist wieder hart.
 *   3. Das Motiv (`--bild`) darf nie länger sein als sein Abschnitt, sonst
 *      leuchtet es unten in den nächsten hinein.
 *
 * Dazu zwei Messfallen, die Geisterfehler erzeugen:
 *   - Lazy geladene Bilder laden im versteckten oder emulierten Fenster nicht.
 *     Deshalb setzt die Prüfung `loading` auf `eager`, bevor sie urteilt.
 *   - Das Stylesheet hängt zehn Minuten im Cache. Vor dem Prüfen einmal
 *     `document.querySelector('link[rel=stylesheet]').href += '?x=' + Date.now()`.
 */
(async function () {
    const link = document.querySelector('link[rel=stylesheet]');
    if (link) link.href = link.href.split('?')[0] + '?x=' + Date.now();
    document.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; });
    await new Promise(r => setTimeout(r, 2500));

    const befunde = [], tabelle = [];
    const w = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > w + 1) {
        befunde.push('waagerechter Überlauf: ' + document.documentElement.scrollWidth + ' statt ' + w);
    }
    document.querySelectorAll('img').forEach(i => {
        if (!i.complete || !i.naturalWidth) befunde.push('Bild lädt nicht: ' + i.getAttribute('src'));
    });

    document.querySelectorAll('.buehne, .final').forEach(s => {
        const foto = s.querySelector('.buehne__foto');
        if (!foto) { befunde.push(s.className + ': kein Foto'); return; }
        const cs = getComputedStyle(s), fs = getComputedStyle(foto);
        const rand = parseFloat(cs.overflowClipMargin) || 0;
        const obenOffen = /^linear-gradient\(rgba\(0, 0, 0, 0\)/.test(fs.maskImage);
        const bild = parseFloat(cs.getPropertyValue('--bild')) || 0;
        const hoehe = s.getBoundingClientRect().height;
        const name = s.className.replace('band ', '');

        if (fs.maskImage === 'none') befunde.push(name + ': keine Blende');
        if (fs.overflow !== 'clip') befunde.push(name + ': Rahmen beschneidet den Zoom nicht (seitlicher Überlauf)');
        if (rand > 0 && !obenOffen) befunde.push(name + ': Foto ragt oben hinaus, Blende ist dort zu → heller Streifen');
        if (rand === 0 && obenOffen) befunde.push(name + ': Blende oben offen, aber kein Clip-Rand → Übergang unsichtbar');
        if (bild > hoehe) befunde.push(name + ': Motiv ' + Math.round(bild - hoehe) + ' px länger als der Abschnitt');

        tabelle.push({Abschnitt: name.slice(0, 32), Motiv: bild, Höhe: Math.round(hoehe), 'Clip-Rand': rand, 'Blende oben offen': obenOffen});
    });

    const hero = document.querySelector('.hero__foto img');
    if (hero && getComputedStyle(hero).animationName === 'none') befunde.push('Hero: keine Bewegung');

    console.table(tabelle);
    if (befunde.length) { console.warn('Befunde:'); befunde.forEach(b => console.warn('  • ' + b)); }
    else console.log('%cAlles sauber.', 'color:#2f8f4e;font-weight:bold');
    return befunde;
})();
