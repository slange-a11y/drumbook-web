/* Drumbook — Bewegung beim Scrollen.
 *
 * Die Klasse .reveal wird hier vergeben und nicht ins HTML geschrieben. Der
 * Grund: Steht sie im Markup, ist der Text ohne JavaScript unsichtbar — und
 * eine Seite, die ihren Inhalt hinter einer Animation versteckt, ist kaputt.
 * So bleibt ohne JavaScript einfach alles stehen, wo es hingehört.
 *
 * Wer im System weniger Bewegung eingestellt hat, wird hier gar nicht erst
 * angefasst.
 */

(function () {
    'use strict';

    var ruhig = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (ruhig || !('IntersectionObserver' in window)) return;

    var wurzel = document.documentElement;
    wurzel.classList.add('js-anim');

    // Was aufgeht, und in welchen Gruppen es versetzt einsetzt.
    var gruppen = [
        '.notice',
        '.head',
        '.problems > .problem',
        '.feature',
        '.grid > .card',
        '.more > .more__card',
        '.privacy',
        '.teacher__split',
        '.teacher__grid > .teacher__card',
        '.teacher__note',
        '.status > .status__col',
        '.faq',
        '.final__in'
    ];

    var beobachter = new IntersectionObserver(function (eintraege) {
        eintraege.forEach(function (eintrag) {
            if (!eintrag.isIntersecting) return;
            var el = eintrag.target;
            var verzug = parseInt(el.getAttribute('data-verzug') || '0', 10);
            setTimeout(function () { el.classList.add('sichtbar'); }, verzug);
            beobachter.unobserve(el);
        });
    }, {
        // Etwas früher auslösen, damit nichts erst mitten im Bild aufgeht.
        rootMargin: '0px 0px -4% 0px',
        threshold: 0.08
    });

    var beobachtet = [];

    gruppen.forEach(function (wahl) {
        var elemente = document.querySelectorAll(wahl);
        Array.prototype.forEach.call(elemente, function (el, i) {
            // Was beim Laden schon im Bild steht, bleibt einfach da — sonst
            // blitzt der Hero beim Öffnen auf.
            if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return;
            el.classList.add('reveal');
            // Nur innerhalb einer Reihe versetzen, und nie länger als 240 ms.
            if (i > 0) el.setAttribute('data-verzug', String(Math.min(i * 80, 240)));
            beobachter.observe(el);
            beobachtet.push(el);
        });
    });

    // Der Hero zeigt eine laufende Session. Das Abspielen steht bewusst hier
    // und nicht als autoplay im Markup: wer weniger Bewegung eingestellt hat,
    // ist oben schon ausgestiegen und sieht das Standbild — so wie jemand
    // ganz ohne JavaScript.
    var film = document.querySelector('.phone--hero video');
    if (film) {
        film.muted = true;              // manche Browser wollen das als Eigenschaft
        var anlaufen = function () {
            var p = film.play();
            if (p && p.catch) p.catch(function () {});
        };
        anlaufen();
        // Kommt der erste Versuch zu frueh, weil noch nichts geladen ist,
        // scheitert er still. Dann eben, sobald genug da ist — sonst bliebe
        // das Standbild fuer immer stehen.
        film.addEventListener('canplay', anlaufen, { once: true });
        // Ausserhalb des Bildes anhalten. Spart Akku, und sehen kann es niemand.
        new IntersectionObserver(function (eintraege) {
            eintraege.forEach(function (e) {
                if (e.isIntersecting) { film.play(); } else { film.pause(); }
            });
        }, { threshold: 0.15 }).observe(film);
    }

    // Sicherheitsgurt. Sollte der Beobachter aus irgendeinem Grund nicht
    // auslösen — ein Browser, der sich anders verhält als erwartet, eine
    // Eigenart beim Zurückkehren aus dem Seiten-Cache —, dann darf das nicht
    // dazu führen, dass Text unsichtbar bleibt. Nach vier Sekunden wird
    // aufgedeckt, was bis dahin nicht von selbst aufgegangen ist.
    setTimeout(function () {
        beobachtet.forEach(function (el) {
            if (!el.classList.contains('sichtbar')) el.classList.add('sichtbar');
        });
    }, 4000);

    // Kommt jemand über den Zurück-Knopf zurück, ist der Zustand oft
    // eingefroren. Dann sofort alles aufdecken.
    window.addEventListener('pageshow', function (e) {
        if (!e.persisted) return;
        beobachtet.forEach(function (el) { el.classList.add('sichtbar'); });
    });
})();
